const mongoose = require("mongoose")

// Composition: Course owns Lectures, Documents, Exams, Certificates
//   → Lectures and Documents are embedded sub-documents (true composition)
//   → Exams and Certificates are referenced by ObjectId (logical composition)
//
// Association (many-to-many):
//   → instructors: List<Instructor>
//   → enrolled students tracked via Enrollment model

const LectureSubSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  videoURL: {
    type: String,
    required: true,
  },
  order: {
    type: Number,
    required: true,
    min: 1,
  },
  isUnlocked: {
    type: Boolean,
    default: false,
  },
  duration: {
    type: Number, // in minutes
    required: true,
    min: 1,
  },
})

const DocumentSubSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  fileURL: {
    type: String,
    required: true,
  },
  isDownloadRestricted: {
    type: Boolean,
    default: false,
  },
})

const CourseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
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
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    visibility: {
      type: String,
      required: true,
      enum: ["public", "private"],
      default: "private",
    },
    accommodationDetails: {
      type: String,
      required: true,
    },

    // Composition — embedded (Lectures & Documents die with Course)
    lectures: {
      type: [LectureSubSchema],
      default: [],
    },
    documents: {
      type: [DocumentSubSchema],
      default: [],
    },

    // Composition — referenced (Exams & Certificates are separate collections
    //   but logically owned by this Course)
    exams: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Exam",
      },
    ],
    certificates: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Certificate",
      },
    ],

    // Association — many-to-many with Instructor
    instructors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // discriminator role = "Instructor"
      },
    ],
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model("Course", CourseSchema)