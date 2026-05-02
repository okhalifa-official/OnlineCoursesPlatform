const mongoose = require("mongoose")

// Association (join entity): links one Student (userId) to one Course (courseId).
// Created on self-enroll, manual admin enroll, or centre enroll.
const EnrollmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // discriminator role = "Student"
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    enrollmentDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    enrollmentType: {
      type: String,
      required: true,
      enum: ["self", "manual", "centre"],
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["active", "expired", "completed", "cancelled"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model("Enrollment", EnrollmentSchema)