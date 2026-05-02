const mongoose = require("mongoose")

// Aggregation: CourseInstance belongs to one Centre (centreId).
// Association: references one Course (courseId), enrolled Students, and Progress records.
const CourseInstanceSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    centreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Centre",
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["scheduled", "ongoing", "completed", "cancelled"],
      default: "scheduled",
    },

    // Association — Students enrolled in this specific instance
    enrolledStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // discriminator role = "Student"
      },
    ],

    // Association — Progress records for students in this instance
    progressRecords: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Progress",
      },
    ],
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model("CourseInstance", CourseInstanceSchema)