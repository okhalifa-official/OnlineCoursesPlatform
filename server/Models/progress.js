const mongoose = require("mongoose")

// Association: tracks one Student's (userId) progress through one Course (courseId).
const ProgressSchema = new mongoose.Schema(
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
    completionPercentage: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 100,
    },
    nextVideo: {
      // Stores the _id of the next lecture sub-document in Course.lectures
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    completedLectures: [
      {
        // Stores _ids of completed lecture sub-documents
        type: mongoose.Schema.Types.ObjectId,
      },
    ],
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model("Progress", ProgressSchema)