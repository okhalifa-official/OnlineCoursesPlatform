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

    manualExchangeRateFallback: {
      type: Number,
      default: 50,
      min: 1,
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