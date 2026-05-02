const mongoose = require("mongoose")
const User = require("./User")

// Inheritance: Student extends User via Mongoose discriminator
const StudentSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
  },
  registeredDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  totalCoursesEnrolled: {
    type: Number,
    default: 0,
  },
})

module.exports = User.discriminator("Student", StudentSchema)