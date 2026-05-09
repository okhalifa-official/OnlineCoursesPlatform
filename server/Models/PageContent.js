const mongoose = require("mongoose");

const sectionSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: "",
    },
    title: {
      type: String,
      default: "",
    },
    subtitle: {
      type: String,
      default: "",
    },
    body: {
      type: String,
      default: "",
    },
    imageUrl: {
      type: String,
      default: "",
    },
    buttonText: {
      type: String,
      default: "",
    },
    buttonLink: {
      type: String,
      default: "",
    },
    items: {
      type: Array,
      default: [],
    },
  },
  { _id: false }
);

const pageContentSchema = new mongoose.Schema(
  {
    pageKey: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    pageName: {
      type: String,
      required: true,
      trim: true,
    },

    title: {
      type: String,
      default: "",
    },

    description: {
      type: String,
      default: "",
    },

    hero: {
      title: {
        type: String,
        default: "",
      },
      subtitle: {
        type: String,
        default: "",
      },
      description: {
        type: String,
        default: "",
      },
      imageUrl: {
        type: String,
        default: "",
      },
      buttonText: {
        type: String,
        default: "",
      },
      buttonLink: {
        type: String,
        default: "",
      },
    },

    sections: {
      type: [sectionSchema],
      default: [],
    },

    isPublished: {
      type: Boolean,
      default: true,
    },

    updatedByName: {
      type: String,
      default: "Admin",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("PageContent", pageContentSchema);