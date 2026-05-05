const mongoose = require("mongoose");

const lessonSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      enum: ["video", "pdf", "audio", "file"],
      default: "video",
    },
    duration: {
      type: String,
      default: "00:00",
    },
  },
  { _id: true }
);

const moduleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: "",
    },
    lessons: {
      type: [lessonSchema],
      default: [],
    },
  },
  { _id: true }
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

    courseFilesNames: {
      type: [String],
      default: [],
    },

    lessonAssetsNames: {
      type: [String],
      default: [],
    },

    modules: {
      type: [moduleSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Course", courseSchema);
