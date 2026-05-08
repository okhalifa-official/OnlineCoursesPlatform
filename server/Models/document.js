const mongoose = require("mongoose");

const DocumentSchema = new mongoose.Schema(
  {
    lectureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lecture",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    fileURL: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Document", DocumentSchema);
