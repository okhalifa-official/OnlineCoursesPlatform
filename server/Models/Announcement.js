const mongoose = require("mongoose");

const recipientSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    name: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      default: "",
    },
    deliveryStatus: {
      type: String,
      enum: ["pending", "sent", "failed", "skipped"],
      default: "pending",
    },
    error: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const announcementSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: true,
      trim: true,
    },

    body: {
      type: String,
      required: true,
      trim: true,
    },

    audienceType: {
      type: String,
      enum: ["all", "students", "instructors", "admins"],
      default: "all",
    },

    center: {
      type: String,
      default: "all",
    },

    course: {
      type: String,
      default: "all",
    },

    deliveryMethod: {
      type: String,
      enum: ["email", "in_app", "both"],
      default: "in_app",
    },

    priority: {
      type: String,
      enum: ["normal", "important", "urgent"],
      default: "normal",
    },

    scheduleType: {
      type: String,
      enum: ["send_now", "schedule_later"],
      default: "send_now",
    },

    scheduledAt: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: ["sent", "scheduled", "failed"],
      default: "sent",
    },

    totalRecipients: {
      type: Number,
      default: 0,
    },

    successfulEmails: {
      type: Number,
      default: 0,
    },

    failedEmails: {
      type: Number,
      default: 0,
    },

    recipients: {
      type: [recipientSchema],
      default: [],
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    createdByName: {
      type: String,
      default: "Admin",
    },

    sentAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Announcement", announcementSchema);