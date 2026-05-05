const mongoose = require("mongoose");

const adminRoleSchema = new mongoose.Schema(
  {
    roleName: {
      type: String,
      default: "Admins",
    },

    accessLevel: {
      type: String,
      default: "Full Access",
    },

    permissions: {
      manageUsers: {
        type: Boolean,
        default: true,
      },

      manageCourses: {
        type: Boolean,
        default: true,
      },

      managePayments: {
        type: Boolean,
        default: true,
      },

      manageReports: {
        type: Boolean,
        default: true,
      },

      manageSettings: {
        type: Boolean,
        default: true,
      },

      viewLogs: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("AdminRole", adminRoleSchema);