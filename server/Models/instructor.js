const mongoose = require("mongoose")
const User = require("./User")

// Inheritance: Instructor extends User via Mongoose discriminator
const InstructorSchema = new mongoose.Schema({
  bio: {
    type: String,
    required: true,
  },
  specialization: {
    type: String,
    required: true,
  },
})

module.exports = User.discriminator("Instructor", InstructorSchema)