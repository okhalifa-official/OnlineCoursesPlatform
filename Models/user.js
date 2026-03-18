const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true,
        enum: ["admin", "user"]
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

// more fields to be added later: phone number, address, courses enrolled, etc.

module.exports = mongoose.model("User", UserSchema)