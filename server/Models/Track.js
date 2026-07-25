const mongoose = require("mongoose");

const trackSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Track name is required"],
      unique: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    color: {
      type: String,
      trim: true,
      default: "#D62828",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Track", trackSchema);
