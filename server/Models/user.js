const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    phone: {
      type: String,
      default: "",
    },

    nationalId: {
      type: String,
      default: "",
    },

    password: {
      type: String,
      default: "",
    },

    gender: {
      type: String,
      enum: ["male", "female", ""],
      default: "",
    },

    dateOfBirth: {
      type: String,
      default: "",
    },

    address: {
      type: String,
      default: "",
    },

    city: {
      type: String,
      default: "",
    },

    profileImageName: {
      type: String,
      default: "",
    },

    role: {
      type: String,
      enum: ["student", "instructor", "admin"],
      default: "student",
    },

    status: {
      type: String,
      enum: ["active", "pending", "suspended"],
      default: "active",
    },

    username: {
      type: String,
      default: "",
    },

    joinDate: {
      type: String,
      default: "",
    },

    permissionsLevel: {
      type: String,
      enum: ["basic", "moderate", "full"],
      default: "basic",
    },

    enrollmentType: {
      type: String,
      enum: ["online", "offline", "hybrid"],
      default: "online",
    },

    educationalCenter: {
      type: String,
      default: "",
    },

    department: {
      type: String,
      default: "",
    },

    gradeLevel: {
      type: String,
      default: "",
    },

    emergencyContact: {
      type: String,
      default: "",
    },

    registeredCourses: {
      type: [String],
      default: [],
    },

    courseStatus: {
      type: String,
      default: "",
    },

    courseStartDate: {
      type: String,
      default: "",
    },

    courseEndDate: {
      type: String,
      default: "",
    },

    parentContact: {
      type: String,
      default: "",
    },

    teachingCourses: {
      type: [String],
      default: [],
    },

    specialty: {
      type: String,
      default: "",
    },

    assignedCenter: {
      type: String,
      default: "",
    },

    teachingStatus: {
      type: String,
      default: "",
    },

    managedCenters: {
      type: [String],
      default: [],
    },

    managedCourses: {
      type: [String],
      default: [],
    },

    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
