const mongoose = require("mongoose");

const paymentSettingsSchema = new mongoose.Schema(
  {
    visaMastercard: {
      type: Boolean,
      default: true,
    },

    digitalWallet: {
      type: Boolean,
      default: true,
    },

    cashOffline: {
      type: Boolean,
      default: false,
    },

    baseCurrency: {
      type: String,
      enum: ["USD", "EUR", "GBP", "EGP"],
      default: "USD",
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

module.exports = mongoose.model("PaymentSettings", paymentSettingsSchema);