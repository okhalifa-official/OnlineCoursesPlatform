const mongoose = require("mongoose")

// Aggregation: Centre manages many CentreAdmins and many CourseInstances.
const CentreSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    contactPhone: {
      type: String,
      required: true,
    },

    // Aggregation — CentreAdmins that manage this centre
    centreAdmins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // discriminator role = "CentreAdmin"
      },
    ],

    // Aggregation — CourseInstances scheduled at this centre
    courseInstances: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CourseInstance",
      },
    ],
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model("Centre", CentreSchema)