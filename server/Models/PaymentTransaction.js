const mongoose = require("mongoose");

function generateTransactionId() {
  const randomNumber = Math.floor(10000000 + Math.random() * 90000000);
  return `TRX-${randomNumber}`;
}

const paymentTransactionSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      unique: true,
      trim: true,
      default: generateTransactionId,
    },

    userName: {
      type: String,
      required: [true, "User name is required"],
      trim: true,
    },

    userEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },

    courseName: {
      type: String,
      required: [true, "Course name is required"],
      trim: true,
    },

    department: {
      type: String,
      trim: true,
    },

    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: 0,
    },

    currency: {
      type: String,
      enum: ["USD", "EUR", "GBP", "EGP"],
      default: "USD",
    },

    method: {
      type: String,
      enum: [
        "Visa",
        "Mastercard",
        "Paypal",
        "Digital Wallet",
        "Cash",
        "Bank Transfer",
      ],
      default: "Visa",
    },

    status: {
      type: String,
      enum: ["success", "pending", "failed", "refunded"],
      default: "pending",
    },

    paymentDate: {
      type: Date,
      default: Date.now,
    },

    gateway: {
      type: String,
      default: "Manual",
      trim: true,
    },

    riskLevel: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Low",
    },

    riskScore: {
      type: Number,
      default: 8,
      min: 0,
      max: 100,
    },

    subtotal: {
      type: Number,
      default: 0,
      min: 0,
    },

    processingFee: {
      type: Number,
      default: 0,
      min: 0,
    },

    tax: {
      type: Number,
      default: 0,
      min: 0,
    },

    notes: {
      type: String,
      trim: true,
    },

    reminderSentAt: {
      type: Date,
    },

    refundedAt: {
      type: Date,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

paymentTransactionSchema.index({
  transactionId: "text",
  userName: "text",
  userEmail: "text",
  courseName: "text",
  method: "text",
  status: "text",
});

module.exports = mongoose.model("PaymentTransaction", paymentTransactionSchema);