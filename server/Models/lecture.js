const mongoose = require("mongoose");

const LectureSchema = new mongoose.Schema(
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
    description: {
      type: String,
      default: "",
    },
    videoURL: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      enum: ["video", "pdf", "audio", "file"],
      default: "video",
    },
    order: {
      type: Number,
      required: true,
      default: 0,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    duration: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Lecture", LectureSchema);
