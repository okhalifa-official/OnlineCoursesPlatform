const mongoose = require("mongoose");

const educationalCenterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Center name is required"],
      trim: true,
    },

    centerCode: {
      type: String,
      required: [true, "Center code is required"],
      unique: true,
      uppercase: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ["Active", "Maintenance", "Pending", "Inactive"],
      default: "Active",
    },

    openingDate: {
      type: Date,
    },

    description: {
      type: String,
      trim: true,
    },

    country: {
      type: String,
      trim: true,
    },

    city: {
      type: String,
      trim: true,
    },

    address: {
      type: String,
      trim: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
    },

    studentCapacity: {
      type: Number,
      default: 0,
      min: 0,
    },

    activeStudents: {
      type: Number,
      default: 0,
      min: 0,
    },

    coursesCapacity: {
      type: Number,
      default: 0,
      min: 0,
    },

    activeCourses: {
      type: Number,
      default: 0,
      min: 0,
    },

    classrooms: {
      type: Number,
      default: 0,
      min: 0,
    },

    assignedManager: {
      type: String,
      trim: true,
    },

    operatingModel: {
      type: String,
      enum: ["Offline", "Online", "Hybrid"],
      default: "Offline",
    },

    certificationRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    imageUrl: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

educationalCenterSchema.index({
  name: "text",
  centerCode: "text",
  country: "text",
  city: "text",
  assignedManager: "text",
});

module.exports = mongoose.model("EducationalCenter", educationalCenterSchema);