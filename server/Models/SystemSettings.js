const mongoose = require("mongoose");

const systemSettingsSchema = new mongoose.Schema(
  {
    platformName: {
      type: String,
      default: "Sono School",
      trim: true,
    },

    platformLanguage: {
      type: String,
      default: "English (US)",
      trim: true,
    },

    platformDescription: {
      type: String,
      default:
        "Sono School is a modern educational platform dedicated to delivering high-quality learning experiences through expert instructors and smart academic tools.",
      trim: true,
    },

    logoUrl: {
      type: String,
      default: "/logo.png",
      trim: true,
    },

    twoFactorEnabled: {
      type: Boolean,
      default: true,
    },

    sessionTimeout: {
      type: String,
      enum: ["30 Minutes", "1 Hour", "4 Hours"],
      default: "30 Minutes",
    },

    emailAlerts: {
      type: Boolean,
      default: true,
    },

    smsNotifications: {
      type: Boolean,
      default: false,
    },

    systemAlerts: {
      type: Boolean,
      default: true,
    },

    systemHealth: {
      type: String,
      default: "Optimal",
    },

    storageUsedGb: {
      type: Number,
      default: 24,
    },

    storageTotalGb: {
      type: Number,
      default: 100,
    },

    lastBackupAt: {
      type: Date,
    },

    lastRestoreAt: {
      type: Date,
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

module.exports = mongoose.model("SystemSettings", systemSettingsSchema);