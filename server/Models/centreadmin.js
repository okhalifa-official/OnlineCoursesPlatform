const mongoose = require("mongoose")
const User = require("./User")

// Inheritance: CentreAdmin extends User via Mongoose discriminator
// Aggregation: belongs to one Centre (centreId)
const CentreAdminSchema = new mongoose.Schema({
  centreId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Centre",
    required: true,
  },
})

module.exports = User.discriminator("CentreAdmin", CentreAdminSchema)