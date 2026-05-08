const mongoose = require("mongoose");

const systemLogSchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    actorName: {
      type: String,
      default: "Unknown User",
      trim: true,
    },

    actorEmail: {
      type: String,
      default: "",
      trim: true,
    },

    actorRole: {
      type: String,
      default: "Guest",
      trim: true,
    },

    module: {
      type: String,
      default: "System",
      trim: true,
    },

    action: {
      type: String,
      required: true,
      trim: true,
    },

    actionType: {
      type: String,
      default: "system",
      trim: true,
    },

    targetEntity: {
      type: String,
      default: "-",
      trim: true,
    },

    targetId: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      enum: ["Success", "Failed"],
      default: "Success",
    },

    statusCode: {
      type: Number,
      default: 200,
    },

    severity: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Low",
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    method: {
      type: String,
      default: "",
    },

    path: {
      type: String,
      default: "",
    },

    ipAddress: {
      type: String,
      default: "",
    },

    userAgent: {
      type: String,
      default: "",
    },

    oldData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    newData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    changes: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("SystemLog", systemLogSchema);