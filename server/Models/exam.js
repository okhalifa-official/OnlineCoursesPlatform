const mongoose = require("mongoose")

// Composition: Exam belongs to one Course (courseId) — cannot exist without it.
// Composition: Exam owns Questions (embedded) and ExamAttempts (referenced).
const ExamSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    passingScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    maxAttempts: {
      type: Number,
      required: true,
      min: 1,
    },

    // Composition — Questions embedded directly in the Exam
    questions: [
      {
        content: {
          type: String,
          required: true,
        },
        options: {
          type: [String],
          required: true,
        },
        correctAnswer: {
          type: String,
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model("Exam", ExamSchema)