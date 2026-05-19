const mongoose = require("mongoose")

const Course = require("../Models/course")
const Enrollment = require("../Models/enrollment")
const Payment = require("../Models/payment")
const PaymentSettings = require("../Models/PaymentSettings")
const PaymentTransaction = require("../Models/PaymentTransaction")
const User = require("../Models/user")
const {
  createHostedPaymentSession,
  getPaymentSession,
  reconcileOrder,
  verifyWebhookSignature,
} = require("../services/kashierPaymentService")

function normalizeAmount(value) {
  return Number(Number(value || 0).toFixed(2))
}

function normalizeCurrency(value) {
  return String(value || "").trim().toUpperCase()
}

function sanitizeGatewayPayload(value) {
  if (!value || typeof value !== "object") {
    return value
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeGatewayPayload)
  }

  const clean = { ...value }

  delete clean.ccvToken
  delete clean.cardDataToken
  delete clean.signatureKeys

  if (clean.card) {
    const cardInfo = clean.card?.cardInfo

    clean.card = cardInfo
      ? {
          cardInfo: {
            cardBrand: cardInfo.cardBrand,
            maskedCard: cardInfo.maskedCard,
          },
        }
      : "[redacted]"
  }

  Object.keys(clean).forEach((key) => {
    const nestedValue = clean[key]

    if (nestedValue && typeof nestedValue === "object") {
      clean[key] = sanitizeGatewayPayload(nestedValue)
    }
  })

  return clean
}

function buildProcessedWebhookKey(eventName, data) {
  return [eventName, data?.transactionId || "na", data?.status || "na"].join(":")
}

function getSuccessfulTransaction(order) {
  const transactions = Array.isArray(order?.transactions) ? [...order.transactions] : []

  return transactions.reverse().find((transaction) => {
    const status = String(transaction?.status || "").toUpperCase()
    const responseCode = String(transaction?.transactionResponseCode || "").toUpperCase()

    return status === "SUCCESS" && responseCode === "00"
  })
}

function isSuccessfulOrder(order) {
  const orderStatus = String(order?.status || "").toUpperCase()

  return ["CAPTURED", "SUCCESS"].includes(orderStatus) && !!getSuccessfulTransaction(order)
}

function isFailedOrder(order) {
  const orderStatus = String(order?.status || "").toUpperCase()

  return ["FAILED", "DECLINED", "VOID", "CANCELLED", "EXPIRED"].includes(orderStatus)
}

function mapPaymentTransactionMethod({ payment, order, webhookData }) {
  const brand = String(
    webhookData?.card?.cardInfo?.cardBrand || payment?.gatewayPayload?.card?.cardInfo?.cardBrand || ""
  ).toLowerCase()

  if (brand.includes("master")) {
    return "Mastercard"
  }

  if (brand.includes("visa")) {
    return "Visa"
  }

  const method = String(webhookData?.method || order?.method || payment?.paymentMethod || "").toLowerCase()

  if (method.includes("wallet")) {
    return "Digital Wallet"
  }

  if (method.includes("bank")) {
    return "Bank Transfer"
  }

  return "Visa"
}

async function getBaseCurrency() {
  const settings = await PaymentSettings.findOne().select("baseCurrency")

  return settings?.baseCurrency || "EGP"
}

async function findOwnedPayment(referenceNumber, userId) {
  return Payment.findOne({
    referenceNumber,
    userId,
  })
}

async function markPaymentFailed(payment, reason, extra = {}) {
  return Payment.findByIdAndUpdate(
    payment._id,
    {
      $set: {
        failureReason: reason,
        gatewayPayload:
          sanitizeGatewayPayload(extra.gatewayPayload) ||
          payment.gatewayPayload ||
          null,
        gatewayStatus: extra.gatewayStatus || payment.gatewayStatus || "FAILED",
        lastWebhookEvent: extra.lastWebhookEvent || payment.lastWebhookEvent,
        lastVerifiedAt: new Date(),
        status: extra.status || "failed",
      },
      $inc: {
        verificationAttempts: extra.incrementAttempts === false ? 0 : 1,
      },
      ...(extra.processedEventKey
        ? { $addToSet: { processedWebhookEvents: extra.processedEventKey } }
        : {}),
    },
    {
      new: true,
      runValidators: true,
    }
  )
}

async function markPaymentPendingFromSession(payment, sessionPayload) {
  const sessionData = sessionPayload?.data || {}

  return Payment.findByIdAndUpdate(
    payment._id,
    {
      $set: {
        gatewayPayload: sessionPayload,
        gatewayStatus: sessionData.status || payment.gatewayStatus,
        gatewayTransactionId:
          sessionData.transactionId || payment.gatewayTransactionId,
        kashierOrderId: sessionData.orderId || payment.kashierOrderId,
        lastVerifiedAt: new Date(),
      },
      $inc: {
        verificationAttempts: 1,
      },
    },
    {
      new: true,
      runValidators: true,
    }
  )
}

async function markPaymentRefunded(payment, webhookData, processedEventKey) {
  return Payment.findByIdAndUpdate(
    payment._id,
    {
      $set: {
        gatewayPayload:
          sanitizeGatewayPayload(webhookData) || payment.gatewayPayload || null,
        gatewayStatus: webhookData?.status || "REFUNDED",
        gatewayTransactionId:
          webhookData?.transactionId || payment.gatewayTransactionId,
        lastVerifiedAt: new Date(),
        lastWebhookEvent: "refund",
        status: "refunded",
      },
      $addToSet: {
        processedWebhookEvents: processedEventKey,
      },
      $inc: {
        verificationAttempts: 1,
      },
    },
    {
      new: true,
      runValidators: true,
    }
  )
}

async function finalizeVerifiedPayment(payment, order, webhookData, processedEventKey) {
  const successfulTransaction = getSuccessfulTransaction(order)

  if (!successfulTransaction) {
    throw new Error("Kashier reconciliation did not return a successful transaction")
  }

  const verifiedAmount = normalizeAmount(successfulTransaction.amount || order?.order?.amount)
  const verifiedCurrency = normalizeCurrency(successfulTransaction.currency || order?.order?.currency)
  const expectedAmount = normalizeAmount(payment.amount)
  const expectedCurrency = normalizeCurrency(payment.currency)

  if (verifiedAmount !== expectedAmount) {
    throw new Error("Verified amount does not match the stored payment amount")
  }

  if (verifiedCurrency !== expectedCurrency) {
    throw new Error("Verified currency does not match the stored payment currency")
  }

  const session = await mongoose.startSession()

  try {
    let finalizedPayment = null

    await session.withTransaction(async function () {
      const currentPayment = await Payment.findById(payment._id).session(session)

      if (!currentPayment) {
        throw new Error("Payment record not found during finalization")
      }

      const [user, course] = await Promise.all([
        User.findById(currentPayment.userId)
          .select("fullName name firstName lastName email department")
          .session(session),
        Course.findById(currentPayment.courseId)
          .select("courseName")
          .session(session),
      ])

      if (!user) {
        throw new Error("Payment user not found during finalization")
      }

      if (!course) {
        throw new Error("Payment course not found during finalization")
      }

      const enrollmentExpiryDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      const userName =
        user.fullName ||
        user.name ||
        `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
        user.email ||
        "User"

      await Enrollment.updateOne(
        {
          userId: currentPayment.userId,
          courseId: currentPayment.courseId,
        },
        {
          $set: {
            expiryDate: enrollmentExpiryDate,
            status: "active",
          },
          $setOnInsert: {
            enrollmentDate: new Date(),
            enrollmentType: "self",
          },
        },
        {
          session,
          upsert: true,
        }
      )

      await PaymentTransaction.findOneAndUpdate(
        {
          referenceNumber: currentPayment.referenceNumber,
        },
        {
          $set: {
            amount: currentPayment.amount,
            courseId: currentPayment.courseId,
            courseName: course.courseName,
            currency: currentPayment.currency,
            gateway: "Kashier",
            gatewayStatus: order.status,
            gatewayTransactionId:
              successfulTransaction.transactionId || currentPayment.gatewayTransactionId,
            method: mapPaymentTransactionMethod({
              payment: currentPayment,
              order,
              webhookData,
            }),
            paymentDate: successfulTransaction.responseDate || new Date(),
            paymentId: currentPayment._id,
            referenceNumber: currentPayment.referenceNumber,
            status: "success",
            userEmail: user.email || "",
            userId: currentPayment.userId,
            userName,
          },
        },
        {
          new: true,
          runValidators: true,
          session,
          setDefaultsOnInsert: true,
          upsert: true,
        }
      )

      const paymentUpdate = {
        $set: {
          failureReason: "",
          finalizedAt: new Date(),
          gatewayPayload: sanitizeGatewayPayload(order),
          gatewayStatus: order.status,
          gatewayTransactionId:
            successfulTransaction.transactionId || currentPayment.gatewayTransactionId,
          kashierOrderId: order.orderId || currentPayment.kashierOrderId,
          lastVerifiedAt: new Date(),
          lastWebhookEvent:
            webhookData?.event || currentPayment.lastWebhookEvent || "verify",
          orderReference: order.orderReference || currentPayment.orderReference,
          paymentMethod:
            webhookData?.method || order.method || currentPayment.paymentMethod,
          status: "confirmed",
        },
        $inc: {
          verificationAttempts: 1,
        },
      }

      if (processedEventKey) {
        paymentUpdate.$addToSet = {
          processedWebhookEvents: processedEventKey,
        }
      }

      finalizedPayment = await Payment.findByIdAndUpdate(
        currentPayment._id,
        paymentUpdate,
        {
          new: true,
          runValidators: true,
          session,
        }
      )
    })

    return finalizedPayment || Payment.findById(payment._id)
  } finally {
    await session.endSession()
  }
}

async function reconcileAndSyncPayment(payment, options = {}) {
  const reconciliation = await reconcileOrder(payment.referenceNumber)
  const order = Array.isArray(reconciliation?.data) ? reconciliation.data[0] : null

  if (!order) {
    if (payment.sessionId) {
      const sessionPayload = await getPaymentSession(payment.sessionId)
      return {
        payment: await markPaymentPendingFromSession(payment, sessionPayload),
        state: "pending",
      }
    }

    return {
      payment,
      state: "pending",
    }
  }

  if (isSuccessfulOrder(order)) {
    return {
      payment: await finalizeVerifiedPayment(
        payment,
        order,
        options.webhookData,
        options.processedEventKey
      ),
      state: "confirmed",
    }
  }

  if (isFailedOrder(order)) {
    return {
      payment: await markPaymentFailed(payment, "Kashier reported a failed payment", {
        gatewayPayload: order,
        gatewayStatus: order.status,
        lastWebhookEvent: options.webhookData?.event,
        processedEventKey: options.processedEventKey,
      }),
      state: "failed",
    }
  }

  if (payment.sessionId) {
    const sessionPayload = await getPaymentSession(payment.sessionId)
    return {
      payment: await markPaymentPendingFromSession(payment, sessionPayload),
      state: "pending",
    }
  }

  return {
    payment,
    state: "pending",
  }
}

const createCheckoutSession = async function (req, res) {
  try {
    const { courseId } = req.body || {}

    if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        message: "A valid courseId is required",
      })
    }

    const [course, existingEnrollment, currency] = await Promise.all([
      Course.findById(courseId).select("courseName coursePrice publishStatus"),
      Enrollment.findOne({
        courseId,
        userId: req.user._id,
        status: { $in: ["active", "completed"] },
      }),
      getBaseCurrency(),
    ])

    if (!course) {
      return res.status(404).json({
        message: "Course not found",
      })
    }

    if (course.publishStatus !== "Published") {
      return res.status(409).json({
        message: "This course is not available for checkout",
      })
    }

    if (existingEnrollment) {
      return res.status(409).json({
        message: "You are already enrolled in this course",
      })
    }

    const courseAmount = normalizeAmount(course.coursePrice)

    if (courseAmount <= 0) {
      return res.status(400).json({
        message: "This course does not require a paid checkout",
      })
    }

    await Payment.updateMany(
      {
        checkoutExpiresAt: { $lte: new Date() },
        courseId,
        status: "pending",
        userId: req.user._id,
      },
      {
        $set: {
          failureReason: "Checkout session expired before a new session was requested",
          gatewayStatus: "EXPIRED",
          status: "expired",
        },
      }
    )

    const reusablePayment = await Payment.findOne({
      checkoutExpiresAt: { $gt: new Date() },
      courseId,
      status: "pending",
      userId: req.user._id,
    }).sort({ createdAt: -1 })

    if (reusablePayment?.sessionUrl) {
      return res.status(200).json({
        amount: reusablePayment.amount,
        currency: reusablePayment.currency,
        expiresAt: reusablePayment.checkoutExpiresAt,
        paymentRef: reusablePayment.referenceNumber,
        sessionUrl: reusablePayment.sessionUrl,
        status: reusablePayment.status,
      })
    }

    let payment

    try {
      payment = await Payment.create({
        amount: courseAmount,
        courseId,
        currency,
        paymentMethod: "card",
        status: "pending",
        userId: req.user._id,
      })
    } catch (error) {
      if (error?.code === 11000) {
        const pendingPayment = await Payment.findOne({
          courseId,
          status: "pending",
          userId: req.user._id,
        }).sort({ createdAt: -1 })

        if (pendingPayment?.sessionUrl) {
          return res.status(200).json({
            amount: pendingPayment.amount,
            currency: pendingPayment.currency,
            expiresAt: pendingPayment.checkoutExpiresAt,
            paymentRef: pendingPayment.referenceNumber,
            sessionUrl: pendingPayment.sessionUrl,
            status: pendingPayment.status,
          })
        }

        return res.status(409).json({
          message: "A checkout session is already being created for this course. Please retry in a few seconds.",
        })
      }

      throw error
    }

    try {
      const checkoutSession = await createHostedPaymentSession({
        amount: payment.amount,
        currency: payment.currency,
        courseId,
        courseName: course.courseName,
        referenceNumber: payment.referenceNumber,
      })

      const updatedPayment = await Payment.findByIdAndUpdate(
        payment._id,
        {
          $set: {
            checkoutExpiresAt: checkoutSession.expireAt,
            gatewayPayload: sanitizeGatewayPayload(checkoutSession.raw),
            gatewayStatus: checkoutSession.gatewayStatus,
            sessionId: checkoutSession.sessionId,
            sessionUrl: checkoutSession.sessionUrl,
          },
        },
        {
          new: true,
          runValidators: true,
        }
      )

      res.locals.auditTarget = `${payment.referenceNumber} - ${course.courseName}`
      res.locals.auditPayload = {
        amount: updatedPayment.amount,
        courseId,
        courseName: course.courseName,
        currency: updatedPayment.currency,
        paymentRef: updatedPayment.referenceNumber,
        sessionId: updatedPayment.sessionId,
        status: updatedPayment.status,
      }

      return res.status(201).json({
        amount: updatedPayment.amount,
        currency: updatedPayment.currency,
        expiresAt: updatedPayment.checkoutExpiresAt,
        paymentRef: updatedPayment.referenceNumber,
        sessionUrl: updatedPayment.sessionUrl,
        status: updatedPayment.status,
      })
    } catch (error) {
      await markPaymentFailed(payment, error.message, {
        gatewayStatus: "SESSION_CREATION_FAILED",
        incrementAttempts: false,
      })

      throw error
    }
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create hosted checkout session",
      error: error.message,
    })
  }
}

const getPaymentStatus = async function (req, res) {
  try {
    const payment = await findOwnedPayment(req.params.referenceNumber, req.user._id)

    if (!payment) {
      return res.status(404).json({
        message: "Payment not found",
      })
    }

    if (payment.status === "expired") {
      return res.status(200).json(payment)
    }

    if (
      payment.status === "pending" &&
      payment.checkoutExpiresAt &&
      payment.checkoutExpiresAt <= new Date()
    ) {
      const expiredPayment = await Payment.findByIdAndUpdate(
        payment._id,
        {
          $set: {
            failureReason: "Checkout session expired before payment confirmation",
            gatewayStatus: payment.gatewayStatus || "EXPIRED",
            status: "expired",
          },
        },
        {
          new: true,
          runValidators: true,
        }
      )

      return res.status(200).json(expiredPayment)
    }

    if (["confirmed", "failed", "refunded"].includes(payment.status)) {
      return res.status(200).json(payment)
    }

    const result = await reconcileAndSyncPayment(payment)

    return res.status(200).json(result.payment)
  } catch (error) {
    return res.status(500).json({
      message: "Failed to verify payment status",
      error: error.message,
    })
  }
}

const handleKashierWebhook = async function (req, res) {
  try {
    const signature = req.header("x-kashier-signature")

    if (!verifyWebhookSignature(req.body, signature)) {
      return res.status(401).json({
        message: "Invalid Kashier webhook signature",
      })
    }

    const eventName = String(req.body?.event || "").toLowerCase()
    const webhookData = req.body?.data || {}
    const paymentRef = webhookData.merchantOrderId

    if (!paymentRef) {
      return res.status(400).json({
        message: "Webhook is missing merchantOrderId",
      })
    }

    const payment = await Payment.findOne({ referenceNumber: paymentRef })

    if (!payment) {
      res.locals.auditTarget = paymentRef
      res.locals.auditPayload = {
        event: eventName,
        paymentRef,
        status: webhookData.status,
      }

      return res.status(200).json({
        ok: true,
        ignored: true,
      })
    }

    const processedEventKey = buildProcessedWebhookKey(eventName, webhookData)

    if (payment.processedWebhookEvents.includes(processedEventKey)) {
      return res.status(200).json({
        ok: true,
        duplicate: true,
      })
    }

    let updatedPayment = payment

    if (eventName === "refund") {
      updatedPayment = await markPaymentRefunded(
        payment,
        webhookData,
        processedEventKey
      )
    } else if (["pay", "capture", "authorize"].includes(eventName)) {
      const result = await reconcileAndSyncPayment(payment, {
        processedEventKey,
        webhookData: {
          ...webhookData,
          event: eventName,
        },
      })

      updatedPayment = result.payment
    } else if (eventName === "void") {
      updatedPayment = await markPaymentFailed(payment, "Payment was voided by Kashier", {
        gatewayPayload: webhookData,
        gatewayStatus: webhookData.status || "VOID",
        lastWebhookEvent: eventName,
        processedEventKey,
      })
    } else {
      updatedPayment = await Payment.findByIdAndUpdate(
        payment._id,
        {
          $set: {
            gatewayPayload: sanitizeGatewayPayload(webhookData),
            lastWebhookEvent: eventName,
          },
          $addToSet: {
            processedWebhookEvents: processedEventKey,
          },
        },
        {
          new: true,
          runValidators: true,
        }
      )
    }

    res.locals.auditTarget = `${payment.referenceNumber} - webhook`
    res.locals.auditPayload = {
      event: eventName,
      gatewayStatus: updatedPayment.gatewayStatus,
      paymentRef: payment.referenceNumber,
      status: updatedPayment.status,
      transactionId:
        webhookData.transactionId || updatedPayment.gatewayTransactionId,
    }

    return res.status(200).json({ ok: true })
  } catch (error) {
    return res.status(500).json({
      message: "Failed to process Kashier webhook",
      error: error.message,
    })
  }
}

module.exports = {
  createCheckoutSession,
  getPaymentStatus,
  handleKashierWebhook,
}