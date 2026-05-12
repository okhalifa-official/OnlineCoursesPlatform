const mongoose = require("mongoose");

// Defined as a real sub-schema (not an inline nested object) so that
// findByIdAndUpdate cleanly $sets the whole exam payload, applies defaults,
// and runs validators on the questions array. Inline nested objects can lose
// fields silently when overwritten in an atomic update.
const ExamQuestionSchema = new mongoose.Schema(
  {
    question: { type: String, default: "" },
    // Optional image (base64 data URL) shown above the question text. Useful
    // for diagrams, ECG strips, ultrasound images, etc.
    image: { type: String, default: "" },
    options: { type: [String], default: [] },
    correctAnswer: { type: Number, default: 0 },
    marks: { type: Number, default: 1 },
  },
  { _id: false }
);

const ExamSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: false },
    durationMinutes: { type: Number, default: 30 },
    passingScore: { type: Number, default: 70 },
    attempts: { type: Number, default: 1 },
    antiCheat: { type: Boolean, default: false },
    maxTabSwitches: { type: Number, default: 3 },

    // Whether the student can navigate back to questions they've already
    // moved past. When false, the previous button is hidden and the tracker
    // grid only allows jumping forward to the current/next question.
    allowPrevious: { type: Boolean, default: true },

    // Whether to display each question's marks (point value) to the student.
    showQuestionMarks: { type: Boolean, default: true },

    // Post-submission answers review:
    //   "never"        — never show answers
    //   "immediately"  — show right after the score screen
    //   "after_date"   — open at a specific calendar date/time
    reviewMode: {
      type: String,
      enum: ["never", "immediately", "after_date"],
      default: "immediately",
    },
    reviewOpensAt: { type: Date, default: null },

    questions: { type: [ExamQuestionSchema], default: [] },
  },
  { _id: false }
);

const courseSchema = new mongoose.Schema(
  {
    courseName: {
      type: String,
      required: true,
      trim: true,
    },

    courseDescription: {
      type: String,
      required: true,
      trim: true,
    },

    coursePrice: {
      type: Number,
      required: true,
      default: 0,
    },

    publishStatus: {
      type: String,
      enum: ["Draft", "Published", "Archived"],
      default: "Draft",
    },

    category: {
      type: String,
      default: "General",
    },

    instructor: {
      type: String,
      default: "Unassigned",
    },

    activeStudents: {
      type: Number,
      default: 0,
    },

    completionRate: {
      type: Number,
      default: 0,
    },

    openTickets: {
      type: Number,
      default: 0,
    },

    previewImage: {
      type: String,
      default: "",
    },

    previewVideoName: {
      type: String,
      default: "",
    },

    previewVideoFile: {
      type: String,
      default: "",
    },

    courseFilesNames: {
      type: [String],
      default: [],
    },

    lessonAssetsNames: {
      type: [String],
      default: [],
    },

    // Real file content for the Material tab. Stored as base64 data URLs so
    // we can stream them through the existing JSON API; capped at 10 MB per
    // file by the admin form because of MongoDB's 16 MB document limit.
    materials: {
      type: [
        {
          name: { type: String, default: "" },
          mimeType: { type: String, default: "application/pdf" },
          data: { type: String, default: "" }, // base64 data URL
          sizeKB: { type: Number, default: 0 },
        },
      ],
      default: [],
    },

    startDate: {
      type: Date,
      default: null,
    },

    endDate: {
      type: Date,
      default: null,
    },

    visibility: {
      type: Boolean,
      default: true,
    },

    accommodationDetails: {
      type: String,
      default: "",
    },

    previewVideoURL: {
      type: String,
      default: "",
    },

    instructors: {
      type: [
        {
          name: { type: String, required: true, trim: true },
        },
      ],
      default: [],
    },

    faqs: {
      type: [
        {
          question: { type: String, default: "" },
          answer: { type: String, default: "" },
        },
      ],
      default: [],
    },

    modules: {
      type: [
        {
          title: { type: String, default: "" },
          lessons: {
            type: [
              {
                title: { type: String, default: "" },
                type: { type: String, default: "video" },
                duration: { type: String, default: "" },
                videoSource: { type: String, default: "url", enum: ["url", "upload"] },
                videoURL: { type: String, default: "" },
                videoFile: { type: String, default: "" },
                // Per-lecture PDF attached alongside the video. Opens in the
                // secure viewer just like the course-level Material entries.
                pdfName: { type: String, default: "" },
                pdfFile: { type: String, default: "" },
                pdfSizeKB: { type: Number, default: 0 },
                description: { type: String, default: "" },
              },
            ],
            default: [],
          },
        },
      ],
      default: [],
    },

    exam: { type: ExamSchema, default: () => ({}) },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Course", courseSchema);
