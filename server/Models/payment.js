const { randomUUID } = require("crypto")
const mongoose = require("mongoose")

function generatePaymentReference() {
  return `PAY-${randomUUID()}`
}

// Association: records a financial transaction by a Student for a Course.
const PaymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // discriminator role = "Student"
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
    referenceNumber: {
      type: String,
      required: true,
      unique: true,
      default: generatePaymentReference,
      trim: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["pending", "confirmed", "failed", "refunded", "expired"],
      default: "pending",
    },

    gateway: {
      type: String,
      default: "kashier",
      trim: true,
    },

    currency: {
      type: String,
      enum: ["USD", "EUR", "GBP", "EGP"],
      default: "EGP",
    },

    paymentMethod: {
      type: String,
      default: "card",
      trim: true,
    },

    sessionId: {
      type: String,
      trim: true,
    },

    sessionUrl: {
      type: String,
      trim: true,
    },

    checkoutExpiresAt: {
      type: Date,
      default: null,
    },

    gatewayStatus: {
      type: String,
      default: "PENDING",
      trim: true,
    },

    kashierOrderId: {
      type: String,
      trim: true,
    },

    orderReference: {
      type: String,
      trim: true,
    },

    gatewayTransactionId: {
      type: String,
      trim: true,
    },

    lastWebhookEvent: {
      type: String,
      trim: true,
    },

    processedWebhookEvents: {
      type: [String],
      default: [],
    },

    verificationAttempts: {
      type: Number,
      default: 0,
      min: 0,
    },

    lastVerifiedAt: {
      type: Date,
      default: null,
    },

    finalizedAt: {
      type: Date,
      default: null,
    },

    failureReason: {
      type: String,
      trim: true,
    },

    gatewayPayload: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
)

PaymentSchema.index({ userId: 1, courseId: 1, status: 1, createdAt: -1 })
PaymentSchema.index(
  { userId: 1, courseId: 1 },
  { unique: true, partialFilterExpression: { status: "pending" } }
)
PaymentSchema.index({ sessionId: 1 }, { unique: true, sparse: true })
PaymentSchema.index({ kashierOrderId: 1 }, { unique: true, sparse: true })
PaymentSchema.index({ orderReference: 1 }, { sparse: true })
PaymentSchema.index({ gatewayTransactionId: 1 }, { sparse: true })

module.exports = mongoose.model("Payment", PaymentSchema)