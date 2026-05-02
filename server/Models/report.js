const mongoose = require("mongoose")

// Association: linked to one Admin (adminId) and one Course (courseId).
const ReportSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // discriminator role = "Admin"
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    fileURL: {
      type: String,
      default: null,
    },
    format: {
      type: String,
      required: true,
      enum: ["pdf", "excel", "csv"],
    },
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model("Report", ReportSchema)