const mongoose = require("mongoose")

// Association: linked to one Lecture (lectureId) and one Student (userId).
// Composition: owns Answers — Answers are embedded and cannot exist without a Question.
const QuestionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // discriminator role = "Student"
      required: true,
    },
    lectureId: {
      // References the embedded lecture _id inside Course.lectures
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    upvoteCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      required: true,
      enum: ["open", "answered", "closed"],
      default: "open",
    },

    // Composition — Answers embedded inside the Question
    answers: [
      {
        adminId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User", // discriminator role = "Admin"
          required: true,
        },
        content: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model("Question", QuestionSchema)