const mongoose = require("mongoose")

const CourseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    directors: {
        type: [String],
        required: true,
    },
    price: {
        type: Number,
        required: true
    },
    accommodation: {
        type: String,
        required: true,
        min: 1
    },
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
    },
    educationalContent: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "EducationalContent",
        required: true
    }],
    visibility: {
        type: String,
        required: true,
        enum: ["public", "private"]
    },
})

module.exports = mongoose.model("Course", CourseSchema)

// name, price, directors, accommodation details, start date, end date, educational content, visibility