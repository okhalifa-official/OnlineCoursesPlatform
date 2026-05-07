const PaymentTransaction = require("../Models/PaymentTransaction");
const PaymentSettings = require("../Models/PaymentSettings");

function buildDateFilter(date) {
  if (!date) return {};

  const now = new Date();

  if (date === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);

    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    return {
      paymentDate: {
        $gte: start,
        $lte: end,
      },
    };
  }

  if (date === "7days") {
    const start = new Date();
    start.setDate(start.getDate() - 7);

    return {
      paymentDate: {
        $gte: start,
      },
    };
  }

  if (date === "30days") {
    const start = new Date();
    start.setDate(start.getDate() - 30);

    return {
      paymentDate: {
        $gte: start,
      },
    };
  }

  return {};
}

async function getOrCreatePaymentSettings() {
  let settings = await PaymentSettings.findOne();

  if (!settings) {
    settings = await PaymentSettings.create({
      visaMastercard: true,
      digitalWallet: true,
      cashOffline: false,
      baseCurrency: "USD",
    });
  }

  return settings;
}

const getPaymentTransactions = async function (req, res) {
  try {
    const {
      search = "",
      status = "",
      method = "",
      date = "",
      page = 1,
      limit = 10,
    } = req.query;

    const filter = {};

    if (search) {
      const regex = new RegExp(search, "i");

      filter.$or = [
        { transactionId: regex },
        { userName: regex },
        { userEmail: regex },
        { courseName: regex },
        { method: regex },
        { status: regex },
      ];
    }

    if (status && status !== "all") {
      filter.status = status;
    }

    if (method && method !== "all") {
      filter.method = method;
    }

    Object.assign(filter, buildDateFilter(date));

    const pageNumber = Number(page) || 1;
    const limitNumber = Number(limit) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    const [payments, total] = await Promise.all([
      PaymentTransaction.find(filter)
        .sort({ paymentDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNumber),
      PaymentTransaction.countDocuments(filter),
    ]);

    return res.status(200).json({
      payments,
      total,
      page: pageNumber,
      totalPages: Math.ceil(total / limitNumber),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to get payment transactions",
      error: error.message,
    });
  }
};

const getPaymentStats = async function (req, res) {
  try {
    const [
      revenueResult,
      successfulPayments,
      failedPayments,
      pendingPayments,
      refundedPayments,
      methodMix,
    ] = await Promise.all([
      PaymentTransaction.aggregate([
        {
          $match: {
            status: "success",
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$amount" },
          },
        },
      ]),

      PaymentTransaction.countDocuments({ status: "success" }),
      PaymentTransaction.countDocuments({ status: "failed" }),
      PaymentTransaction.countDocuments({ status: "pending" }),
      PaymentTransaction.countDocuments({ status: "refunded" }),

      PaymentTransaction.aggregate([
        {
          $group: {
            _id: "$method",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const totalRevenue = revenueResult[0]?.totalRevenue || 0;
    const totalMethods = methodMix.reduce((sum, item) => sum + item.count, 0);

    const methods = methodMix.map((item) => ({
      method: item._id,
      count: item.count,
      percentage:
        totalMethods === 0 ? 0 : Math.round((item.count / totalMethods) * 100),
    }));

    return res.status(200).json({
      totalRevenue,
      successfulPayments,
      failedPayments,
      pendingPayments,
      refundedPayments,
      methods,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to get payment stats",
      error: error.message,
    });
  }
};

const getPaymentTransactionById = async function (req, res) {
  try {
    const payment = await PaymentTransaction.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        message: "Payment transaction not found",
      });
    }

    return res.status(200).json(payment);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to get payment transaction",
      error: error.message,
    });
  }
};

const createPaymentTransaction = async function (req, res) {
  try {
    const payment = await PaymentTransaction.create({
      ...req.body,
      createdBy: req.user?._id,
      updatedBy: req.user?._id,
    });

    return res.status(201).json(payment);
  } catch (error) {
    return res.status(400).json({
      message: "Failed to create payment transaction",
      error: error.message,
    });
  }
};

const updatePaymentTransaction = async function (req, res) {
  try {
    const payment = await PaymentTransaction.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        updatedBy: req.user?._id,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!payment) {
      return res.status(404).json({
        message: "Payment transaction not found",
      });
    }

    return res.status(200).json(payment);
  } catch (error) {
    return res.status(400).json({
      message: "Failed to update payment transaction",
      error: error.message,
    });
  }
};

const updatePaymentStatus = async function (req, res) {
  try {
    const { status } = req.body;

    if (!["success", "pending", "failed", "refunded"].includes(status)) {
      return res.status(400).json({
        message: "Invalid payment status",
      });
    }

    const updateData = {
      status,
      updatedBy: req.user?._id,
    };

    if (status === "refunded") {
      updateData.refundedAt = new Date();
    }

    const payment = await PaymentTransaction.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!payment) {
      return res.status(404).json({
        message: "Payment transaction not found",
      });
    }

    res.locals.auditTarget = `${payment.transactionId} - ${payment.courseName}`;
    res.locals.auditPayload = {
      transactionId: payment.transactionId,
      courseName: payment.courseName,
      userName: payment.userName,
      newStatus: payment.status,
    };

    return res.status(200).json(payment);
  } catch (error) {
    return res.status(400).json({
      message: "Failed to update payment status",
      error: error.message,
    });
  }
};

const refundPaymentTransaction = async function (req, res) {
  try {
    const payment = await PaymentTransaction.findByIdAndUpdate(
      req.params.id,
      {
        status: "refunded",
        refundedAt: new Date(),
        updatedBy: req.user?._id,
        notes: req.body.notes || "Refund requested by admin",
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!payment) {
      return res.status(404).json({
        message: "Payment transaction not found",
      });
    }

    res.locals.auditTarget = `${payment.transactionId} - ${payment.courseName}`;
    res.locals.auditPayload = {
      transactionId: payment.transactionId,
      courseName: payment.courseName,
      userName: payment.userName,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      refundedAt: payment.refundedAt,
    };

    return res.status(200).json(payment);
  } catch (error) {
    return res.status(400).json({
      message: "Failed to refund payment",
      error: error.message,
    });
  }
};

const sendPaymentReminder = async function (req, res) {
  try {
    const payment = await PaymentTransaction.findByIdAndUpdate(
      req.params.id,
      {
        reminderSentAt: new Date(),
        updatedBy: req.user?._id,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!payment) {
      return res.status(404).json({
        message: "Payment transaction not found",
      });
    }

    res.locals.auditTarget = `${payment.transactionId} - ${payment.courseName}`;
    res.locals.auditPayload = {
      transactionId: payment.transactionId,
      courseName: payment.courseName,
      userName: payment.userName,
      userEmail: payment.userEmail,
      reminderSentAt: payment.reminderSentAt,
    };

    return res.status(200).json({
      message: "Payment reminder sent successfully",
      payment,
    });
  } catch (error) {
    return res.status(400).json({
      message: "Failed to send payment reminder",
      error: error.message,
    });
  }
};

const deletePaymentTransaction = async function (req, res) {
  try {
    const payment = await PaymentTransaction.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        message: "Payment transaction not found",
      });
    }

    res.locals.auditTarget = `${payment.transactionId} - ${payment.courseName}`;
    res.locals.auditPayload = {
      deletedPayment: {
        transactionId: payment.transactionId,
        userName: payment.userName,
        userEmail: payment.userEmail,
        courseName: payment.courseName,
        amount: payment.amount,
        currency: payment.currency,
        method: payment.method,
        status: payment.status,
      },
    };

    await PaymentTransaction.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      message: "Payment transaction deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete payment transaction",
      error: error.message,
    });
  }
};
const getPaymentSettings = async function (req, res) {
  try {
    const settings = await getOrCreatePaymentSettings();

    return res.status(200).json(settings);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to get payment settings",
      error: error.message,
    });
  }
};

const updatePaymentSettings = async function (req, res) {
  try {
    const currentSettings = await getOrCreatePaymentSettings();

    const updatedSettings = await PaymentSettings.findByIdAndUpdate(
      currentSettings._id,
      {
        visaMastercard: Boolean(req.body.visaMastercard),
        digitalWallet: Boolean(req.body.digitalWallet),
        cashOffline: Boolean(req.body.cashOffline),
        baseCurrency: req.body.baseCurrency || currentSettings.baseCurrency,
        updatedBy: req.user?._id,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    return res.status(200).json(updatedSettings);
  } catch (error) {
    return res.status(400).json({
      message: "Failed to update payment settings",
      error: error.message,
    });
  }
};

const seedPaymentTransactions = async function (req, res) {
  try {
    const existingCount = await PaymentTransaction.countDocuments();

    if (existingCount > 0) {
      return res.status(200).json({
        message: "Payment transactions already exist",
      });
    }

    await PaymentTransaction.insertMany([
      {
        userName: "Elena Rodriguez",
        userEmail: "elena@sono.edu",
        courseName: "Advanced Neural Networks",
        department: "AI Department",
        amount: 199,
        subtotal: 190,
        processingFee: 9,
        tax: 0,
        currency: "USD",
        method: "Visa",
        status: "success",
        gateway: "Stripe",
        riskLevel: "Low",
        riskScore: 8,
        paymentDate: new Date(),
      },
      {
        userName: "Marcus Chen",
        userEmail: "marcus@sono.edu",
        courseName: "Philosophy of Ethics",
        department: "Humanities",
        amount: 89.5,
        subtotal: 85,
        processingFee: 4.5,
        tax: 0,
        currency: "USD",
        method: "Paypal",
        status: "pending",
        gateway: "Paypal",
        riskLevel: "Medium",
        riskScore: 34,
        paymentDate: new Date(),
      },
      {
        userName: "Sarah Jenkins",
        userEmail: "sarah@sono.edu",
        courseName: "Digital Marketing 101",
        department: "Business",
        amount: 145,
        subtotal: 140,
        processingFee: 5,
        tax: 0,
        currency: "USD",
        method: "Mastercard",
        status: "failed",
        gateway: "Stripe",
        riskLevel: "High",
        riskScore: 78,
        paymentDate: new Date(),
      },
      {
        userName: "David Miller",
        userEmail: "david@sono.edu",
        courseName: "Python for Data Science",
        department: "Technology",
        amount: 299,
        subtotal: 285,
        processingFee: 14,
        tax: 0,
        currency: "USD",
        method: "Visa",
        status: "success",
        gateway: "Stripe",
        riskLevel: "Low",
        riskScore: 10,
        paymentDate: new Date(),
      },
    ]);

    return res.status(201).json({
      message: "Payment transactions seeded successfully",
    });
  } catch (error) {
    return res.status(400).json({
      message: "Failed to seed payment transactions",
      error: error.message,
    });
  }
};

module.exports = {
  getPaymentTransactions,
  getPaymentStats,
  getPaymentTransactionById,
  createPaymentTransaction,
  updatePaymentTransaction,
  updatePaymentStatus,
  refundPaymentTransaction,
  sendPaymentReminder,
  deletePaymentTransaction,
  getPaymentSettings,
  updatePaymentSettings,
  seedPaymentTransactions,
};
