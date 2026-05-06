const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      default: "",
    },

    lastName: {
      type: String,
      default: "",
    },

    fullName: {
      type: String,
      default: "",
    },

    name: {
      type: String,
      default: "",
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    passwordHash: {
      type: String,
      required: true,
      select: false,
    },

    phone: {
      type: String,
      default: "",
    },

    nationalId: {
      type: String,
      default: "",
    },

    gender: {
      type: String,
      enum: ["male", "female", "Male", "Female", ""],
      default: "",
      set: function (value) {
        return String(value || "").toLowerCase();
      },
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

    profileImage: {
      type: String,
      default: "",
    },

    image: {
      type: String,
      default: "",
    },

    role: {
      type: String,
      enum: ["student", "instructor", "admin"],
      default: "student",
    },

    adminLevel: {
      type: String,
      enum: ["none", "admin", "super_admin"],
      default: "none",
    },

    status: {
      type: String,
      enum: ["active", "pending", "suspended"],
      default: "active",
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

    center: {
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

    bio: {
      type: String,
      default: "",
    },

    jobTitle: {
      type: String,
      default: "",
    },

    office: {
      type: String,
      default: "",
    },

    location: {
      type: String,
      default: "",
    },

    employeeId: {
      type: String,
      default: "",
    },

    shift: {
      type: String,
      default: "",
    },

    reportingTo: {
      type: String,
      default: "",
    },

    accessLevel: {
      type: String,
      default: "",
    },

    accountStatus: {
      type: String,
      default: "Active",
    },

    activeSessions: {
      type: String,
      default: "1 Device",
    },

    twoFactor: {
      type: String,
      default: "Enabled",
    },

    lastLogin: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);