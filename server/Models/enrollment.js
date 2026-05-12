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

    // Number of exam attempts this student has consumed for the course. Bumped
    // every time the exam is submitted; admins can reset it from the Manage
    // Students page to grant another attempt.
    examAttemptsUsed: {
      type: Number,
      default: 0,
    },

    // Best score (%) the student has achieved on the exam, used by the admin
    // dashboard. Populated whenever an attempt finishes.
    examBestScore: {
      type: Number,
      default: 0,
    },

    // Score (%) from the most recent attempt — surfaced on the student's
    // course view so they can see their final result without leaving the page.
    examLastScore: {
      type: Number,
      default: 0,
    },

    examLastReason: {
      type: String,
      enum: ["", "submitted", "timeout", "disqualified"],
      default: "",
    },

    examLastTakenAt: {
      type: Date,
      default: null,
    },

    // Whether the student has cleared the passing mark at least once.
    examPassed: {
      type: Boolean,
      default: false,
    },

    // Lecture progress mirror (clientId → done) so admins can see a completion
    // percentage. Stored as a plain object keyed by "moduleIdx-lessonIdx".
    completedLessons: {
      type: Map,
      of: Boolean,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model("Enrollment", EnrollmentSchema)