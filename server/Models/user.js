const mongoose = require("mongoose")

// Base schema used as the discriminator root for Student, Admin, Instructor, CentreAdmin
const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    discriminatorKey: "role", // "Student" | "Admin" | "Instructor" | "CentreAdmin"
  }
)

module.exports = mongoose.model("User", UserSchema)