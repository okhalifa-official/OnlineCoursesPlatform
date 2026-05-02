const mongoose = require("mongoose")

// Composition: Certificate belongs to one Course (courseId) — cannot exist without it.
// Association: linked to one Student (userId).
const CertificateSchema = new mongoose.Schema(
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
    issueDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    fileURL: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["pending", "underReview", "approved", "issued"],
      default: "pending",
    },
    externalReferenceId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model("Certificate", CertificateSchema)