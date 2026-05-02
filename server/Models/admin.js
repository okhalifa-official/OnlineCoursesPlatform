const mongoose = require("mongoose")
const User = require("./User")

// Inheritance: Admin extends User via Mongoose discriminator
// The discriminatorKey "role" on the User collection already identifies this document
// as an Admin — no extra role field needed.
const AdminSchema = new mongoose.Schema({})

module.exports = User.discriminator("Admin", AdminSchema)