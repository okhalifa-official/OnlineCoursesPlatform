const mongoose = require("mongoose")

// Composition: ExamAttempt belongs to one Exam (examId) — cannot exist without it.
// Association: linked to one Student (userId).
const ExamAttemptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // discriminator role = "Student"
      required: true,
    },
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    attemptDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    status: {
      type: String,
      required: true,
      enum: ["submitted", "graded"],
      default: "submitted",
    },
    passed: {
      type: Boolean,
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model("ExamAttempt", ExamAttemptSchema)