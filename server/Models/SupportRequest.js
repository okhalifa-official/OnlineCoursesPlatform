const mongoose = require("mongoose");

const supportRequestSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    pageName: {
      type: String,
      required: true,
      trim: true,
    },

    issueType: {
      type: String,
      enum: [
        "Technical",
        "Users",
        "Courses",
        "Payments",
        "Reports",
        "Educational Centers",
        "Settings",
        "Other",
      ],
      default: "Technical",
    },

    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ["Open", "In Progress", "Resolved", "Closed"],
      default: "Open",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("SupportRequest", supportRequestSchema);