const mongoose = require("mongoose");

const Course = require("../Models/course");
const Enrollment = require("../Models/enrollment");
const Payment = require("../Models/payment");
const PaymentTransaction = require("../Models/PaymentTransaction");
const User = require("../Models/user");
const { verifyInstaPayScreenshot } = require("../services/paymentVerification");
const { sendInvoiceEmail } = require("../utils/invoiceEmail");
const { createNotification } = require("./notifications");

async function safeSendInvoice(payload) {
  try {
    await sendInvoiceEmail(payload);
  } catch (error) {
    console.error("Invoice email failed:", error.message);
  }
}

const DEFAULT_CURRENCY = String(process.env.INSTAPAY_CURRENCY || "EGP").toUpperCase();
const MERCHANT_HANDLE = String(process.env.INSTAPAY_HANDLE || "").trim();
const MAX_SCREENSHOT_BYTES = 8 * 1024 * 1024;
const MAX_TRANSACTION_AGE_MINUTES = 180;

function normalizeAmount(value) {
  return Number(Number(value || 0).toFixed(2));
}

function decodeBase64Image(dataUrl) {
  if (!dataUrl || typeof dataUrl !== "string") {
    return null;
  }

  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);

  if (match) {
    return { mimeType: match[1], base64: match[2] };
  }

  const trimmed = dataUrl.replace(/\s+/g, "");
  if (/^[A-Za-z0-9+/=]+$/.test(trimmed)) {
    return { mimeType: "image/jpeg", base64: trimmed };
  }

  return null;
}

function getUserDisplayName(user) {
  return (
    user.fullName ||
    user.name ||
    `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
    user.email ||
    "User"
  );
}

async function enrollAndRecordTransaction({ payment, user, course, session }) {
  const enrollmentExpiryDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

  await Enrollment.updateOne(
    {
      userId: payment.userId,
      courseId: payment.courseId,
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
  );

  await PaymentTransaction.findOneAndUpdate(
    {
      referenceNumber: payment.referenceNumber,
    },
    {
      $set: {
        amount: payment.amount,
        courseId: payment.courseId,
        courseName: course.courseName,
        currency: payment.currency,
        gateway: "InstaPay",
        gatewayStatus: "AI_VERIFIED",
        gatewayTransactionId: payment.instapayReference,
        method: "Bank Transfer",
        paymentDate: new Date(),
        paymentId: payment._id,
        referenceNumber: payment.referenceNumber,
        status: "success",
        userEmail: user.email || "",
        userId: payment.userId,
        userName: getUserDisplayName(user),
      },
    },
    {
      new: true,
      runValidators: true,
      session,
      setDefaultsOnInsert: true,
      upsert: true,
    }
  );
}

const submitInstapayPayment = async function (req, res) {
  try {
    if (!MERCHANT_HANDLE) {
      return res.status(500).json({
        message: "InstaPay is not configured on the server (missing INSTAPAY_HANDLE).",
      });
    }

    const { courseId, screenshotBase64 } = req.body || {};

    if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        message: "A valid courseId is required",
      });
    }

    const decoded = decodeBase64Image(screenshotBase64);

    if (!decoded) {
      return res.status(400).json({
        message: "A screenshot image (base64 or data URL) is required",
      });
    }

    const approximateBytes = Math.floor((decoded.base64.length * 3) / 4);

    if (approximateBytes > MAX_SCREENSHOT_BYTES) {
      return res.status(413).json({
        message: `Screenshot is too large (max ${Math.floor(MAX_SCREENSHOT_BYTES / (1024 * 1024))} MB)`,
      });
    }

    const [course, existingEnrollment] = await Promise.all([
      Course.findById(courseId).select("courseName coursePrice publishStatus"),
      Enrollment.findOne({
        courseId,
        userId: req.user._id,
        status: { $in: ["active", "completed"] },
      }),
    ]);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (course.publishStatus !== "Published") {
      return res.status(409).json({ message: "This course is not available for checkout" });
    }

    if (existingEnrollment) {
      return res.status(409).json({ message: "You are already enrolled in this course" });
    }

    const courseAmount = normalizeAmount(course.coursePrice);

    if (courseAmount <= 0) {
      return res.status(400).json({ message: "This course does not require a paid checkout" });
    }

    await Payment.updateMany(
      {
        courseId,
        userId: req.user._id,
        status: "pending",
        gateway: { $ne: "instapay" },
        checkoutExpiresAt: { $lte: new Date() },
      },
      {
        $set: {
          failureReason: "Superseded by an InstaPay submission",
          status: "expired",
        },
      }
    );

    let verification;

    try {
      verification = await verifyInstaPayScreenshot({
        screenshotBase64: decoded.base64,
        screenshotMimeType: decoded.mimeType,
        expectedAmount: courseAmount,
        expectedCurrency: DEFAULT_CURRENCY,
        expectedRecipientHandle: MERCHANT_HANDLE,
        maxAgeMinutes: MAX_TRANSACTION_AGE_MINUTES,
      });
    } catch (error) {
      console.error("Gemini verification failed:", error.message);

      return res.status(502).json({
        message:
          "Automated verification is temporarily unavailable. Please try again in a minute or contact support.",
        error: error.message,
      });
    }

    const extractedRefNumber = String(verification?.extracted?.referenceNumber || "").trim();

    if (extractedRefNumber) {
      const duplicateReferenceUse = await Payment.findOne({
        instapayReference: extractedRefNumber,
        status: { $in: ["pending", "confirmed"] },
      });

      if (duplicateReferenceUse) {
        return res.status(200).json({
          status: "rejected",
          reasons: [
            "This InstaPay transaction has already been used for another course.",
          ],
          checks: verification.checks,
          extractedData: verification.extracted,
        });
      }
    }

    if (verification.status === "rejected") {
      return res.status(200).json({
        status: "rejected",
        reasons: verification.reasons,
        checks: verification.checks,
        extractedData: verification.extracted,
      });
    }

    const paymentStatus = verification.status === "verified" ? "confirmed" : "pending";

    let createdPayment;

    try {
      createdPayment = await Payment.create({
        amount: courseAmount,
        courseId,
        currency: DEFAULT_CURRENCY,
        gateway: "instapay",
        paymentMethod: "instapay",
        status: paymentStatus,
        userId: req.user._id,
        instapayReference: extractedRefNumber || null,
        screenshotBase64: decoded.base64,
        screenshotMimeType: decoded.mimeType,
        verificationStatus: verification.status,
        verificationReasons: verification.reasons,
        extractedData: verification.extracted,
        gatewayStatus: verification.status === "verified" ? "AI_VERIFIED" : "PENDING_REVIEW",
        finalizedAt: verification.status === "verified" ? new Date() : null,
        lastVerifiedAt: new Date(),
      });
    } catch (error) {
      if (error?.code === 11000) {
        return res.status(409).json({
          message: "You already have a pending payment for this course. Please wait for it to resolve first.",
        });
      }

      throw error;
    }

    if (verification.status === "verified") {
      const dbSession = await mongoose.startSession();
      let studentForEmail = null;

      try {
        await dbSession.withTransaction(async function () {
          const [user] = await Promise.all([
            User.findById(req.user._id)
              .select("fullName name firstName lastName email department")
              .session(dbSession),
          ]);

          if (!user) {
            throw new Error("User not found while enrolling");
          }

          studentForEmail = user;

          await enrollAndRecordTransaction({
            payment: createdPayment,
            user,
            course,
            session: dbSession,
          });
        });
      } finally {
        await dbSession.endSession();
      }

      if (studentForEmail?.email) {
        safeSendInvoice({
          to: studentForEmail.email,
          studentName: getUserDisplayName(studentForEmail),
          courseName: course.courseName,
          amount: createdPayment.amount,
          currency: createdPayment.currency,
          referenceNumber: createdPayment.referenceNumber,
          instapayReference: extractedRefNumber,
          paidAt: createdPayment.finalizedAt || new Date(),
          method: "InstaPay",
        });
      }

      await createNotification({
        userId: req.user._id,
        type: "enrollment",
        title: `You're enrolled in ${course.courseName}`,
        body: `Your payment of ${createdPayment.amount} ${createdPayment.currency} was verified. Start learning any time.`,
        link: `/learn/${course._id}`,
        metadata: { courseId: course._id, paymentId: createdPayment._id },
      });
    } else {
      await createNotification({
        userId: req.user._id,
        type: "payment_received",
        title: `Payment received for ${course.courseName}`,
        body: `We got your submission. Our team is confirming it — you'll get another notification once it's approved.`,
        link: `/payment-history`,
        metadata: { courseId: course._id, paymentId: createdPayment._id },
      });
    }

    res.locals.auditTarget = `${createdPayment.referenceNumber} - ${course.courseName}`;
    res.locals.auditPayload = {
      amount: createdPayment.amount,
      courseId,
      courseName: course.courseName,
      currency: createdPayment.currency,
      instapayReference: extractedRefNumber,
      paymentRef: createdPayment.referenceNumber,
      verificationStatus: createdPayment.verificationStatus,
    };

    return res.status(201).json({
      status: verification.status,
      paymentRef: createdPayment.referenceNumber,
      reasons: verification.reasons,
      checks: verification.checks,
      extractedData: verification.extracted,
      enrolled: verification.status === "verified",
    });
  } catch (error) {
    console.error("submitInstapayPayment error:", error);

    return res.status(500).json({
      message: "Failed to submit InstaPay payment",
      error: error.message,
    });
  }
};

const getInstapayConfig = async function (req, res) {
  return res.status(200).json({
    handle: MERCHANT_HANDLE,
    currency: DEFAULT_CURRENCY,
  });
};

const listMyPaymentHistory = async function (req, res) {
  try {
    const payments = await Payment.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate("courseId", "courseName coursePrice")
      .lean();

    const items = payments.map(function (p) {
      const isInstapay = p.gateway === "instapay";

      return {
        _id: p._id,
        referenceNumber: p.referenceNumber,
        courseId: p.courseId?._id,
        courseName: p.courseId?.courseName || "Course",
        amount: p.amount,
        currency: p.currency,
        gateway: p.gateway,
        status: p.status,
        verificationStatus: p.verificationStatus,
        gatewayStatus: p.gatewayStatus,
        instapayReference: p.instapayReference,
        verificationReasons: p.verificationReasons || [],
        createdAt: p.createdAt,
        finalizedAt: p.finalizedAt,
        failureReason: p.failureReason || "",
        displayStatus: isInstapay
          ? p.verificationStatus === "verified"
            ? p.gatewayStatus === "MANUALLY_APPROVED"
              ? "approved"
              : "auto_approved"
            : p.verificationStatus === "rejected"
            ? "rejected"
            : "under_review"
          : p.status,
      };
    });

    return res.status(200).json({ items });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load payment history", error: error.message });
  }
};

const listPendingInstapayReviews = async function (req, res) {
  try {
    const payments = await Payment.find({
      gateway: "instapay",
    })
      .sort({ createdAt: -1 })
      .limit(200)
      .select("+screenshotBase64")
      .populate("userId", "fullName name email username")
      .populate("courseId", "courseName coursePrice")
      .lean();

    const items = payments.map(function (p) {
      return {
        _id: p._id,
        referenceNumber: p.referenceNumber,
        amount: p.amount,
        currency: p.currency,
        createdAt: p.createdAt,
        instapayReference: p.instapayReference,
        verificationStatus: p.verificationStatus,
        status: p.status,
        verificationReasons: p.verificationReasons,
        extractedData: p.extractedData,
        finalizedAt: p.finalizedAt,
        gatewayStatus: p.gatewayStatus,
        screenshotDataUrl: p.screenshotBase64
          ? `data:${p.screenshotMimeType || "image/jpeg"};base64,${p.screenshotBase64}`
          : null,
        user: p.userId
          ? {
              _id: p.userId._id,
              name: p.userId.fullName || p.userId.name || p.userId.username,
              email: p.userId.email,
            }
          : null,
        course: p.courseId
          ? {
              _id: p.courseId._id,
              courseName: p.courseId.courseName,
              coursePrice: p.courseId.coursePrice,
            }
          : null,
      };
    });

    return res.status(200).json({ items });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load InstaPay submissions", error: error.message });
  }
};

const approveInstapayPayment = async function (req, res) {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    if (payment.gateway !== "instapay") {
      return res.status(400).json({ message: "This payment is not an InstaPay submission" });
    }

    if (payment.status === "confirmed") {
      return res.status(200).json({ message: "Payment already confirmed", payment });
    }

    const [user, course] = await Promise.all([
      User.findById(payment.userId).select("fullName name firstName lastName email department"),
      Course.findById(payment.courseId).select("courseName coursePrice"),
    ]);

    if (!user) {
      return res.status(404).json({ message: "Payment user not found" });
    }

    if (!course) {
      return res.status(404).json({ message: "Payment course not found" });
    }

    const dbSession = await mongoose.startSession();

    try {
      await dbSession.withTransaction(async function () {
        await enrollAndRecordTransaction({
          payment,
          user,
          course,
          session: dbSession,
        });

        await Payment.findByIdAndUpdate(
          payment._id,
          {
            $set: {
              status: "confirmed",
              verificationStatus: "verified",
              gatewayStatus: "MANUALLY_APPROVED",
              finalizedAt: new Date(),
              lastVerifiedAt: new Date(),
            },
          },
          { session: dbSession }
        );
      });
    } finally {
      await dbSession.endSession();
    }

    if (user?.email) {
      safeSendInvoice({
        to: user.email,
        studentName: getUserDisplayName(user),
        courseName: course.courseName,
        amount: payment.amount,
        currency: payment.currency,
        referenceNumber: payment.referenceNumber,
        instapayReference: payment.instapayReference,
        paidAt: new Date(),
        method: "InstaPay",
      });
    }

    await createNotification({
      userId: payment.userId,
      type: "payment_approved",
      title: `You're enrolled in ${course.courseName}`,
      body: `Your payment was approved by our team. You can start learning right away.`,
      link: `/learn/${course._id}`,
      metadata: { courseId: course._id, paymentId: payment._id },
    });

    return res.status(200).json({ message: "Payment approved and student enrolled" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to approve payment", error: error.message });
  }
};

const rejectInstapayPayment = async function (req, res) {
  try {
    const { reason } = req.body || {};
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    if (payment.gateway !== "instapay") {
      return res.status(400).json({ message: "This payment is not an InstaPay submission" });
    }

    await Payment.findByIdAndUpdate(
      payment._id,
      {
        $set: {
          status: "failed",
          verificationStatus: "rejected",
          gatewayStatus: "MANUALLY_REJECTED",
          failureReason: String(reason || "Rejected by admin"),
          lastVerifiedAt: new Date(),
        },
      }
    );

    await createNotification({
      userId: payment.userId,
      type: "payment_rejected",
      title: "Payment could not be verified",
      body: String(reason || "Our team could not verify your payment. Please review your submission and try again."),
      link: `/payment-history`,
      metadata: { paymentId: payment._id },
    });

    return res.status(200).json({ message: "Payment rejected" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to reject payment", error: error.message });
  }
};

module.exports = {
  submitInstapayPayment,
  getInstapayConfig,
  listMyPaymentHistory,
  listPendingInstapayReviews,
  approveInstapayPayment,
  rejectInstapayPayment,
};
