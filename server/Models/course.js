const mongoose = require("mongoose");

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
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Course", courseSchema);
