const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      default: "Admin",
    },

    lastName: {
      type: String,
      default: "User",
    },

    gender: {
      type: String,
      default: "Male",
    },

    dateOfBirth: {
      type: String,
      default: "1994-03-12",
    },

    bio: {
      type: String,
      default:
        "Responsible for managing platform operations, administrator permissions, academic monitoring, and core system workflows across Sono School.",
    },

    email: {
      type: String,
      required: true,
      unique: true,
      default: "admin@sonoschool.com",
    },

    phone: {
      type: String,
      default: "+20 100 123 4567",
    },

    office: {
      type: String,
      default: "A-204",
    },

    location: {
      type: String,
      default: "Main Headquarters, Cairo",
    },

    address: {
      type: String,
      default: "6th Floor, Administration Building, Sono School Campus",
    },

    jobTitle: {
      type: String,
      default: "System Administrator",
    },

    department: {
      type: String,
      default: "Administration",
    },

    employeeId: {
      type: String,
      default: "ADM-00142",
    },

    joinDate: {
      type: String,
      default: "15 January 2021",
    },

    shift: {
      type: String,
      default: "Full Time",
    },

    reportingTo: {
      type: String,
      default: "Board Management",
    },

    username: {
      type: String,
      default: "admin_user",
    },

    accessLevel: {
      type: String,
      default: "Super Admin",
    },

    accountStatus: {
      type: String,
      default: "Active",
    },

    lastLogin: {
      type: String,
      default: "",
    },

    activeSessions: {
      type: String,
      default: "1 Device",
    },

    twoFactor: {
      type: String,
      default: "Enabled",
    },

    image: {
      type: String,
      default: "",
    },

    passwordHash: {
      type: String,
      select: false,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Admin", adminSchema);