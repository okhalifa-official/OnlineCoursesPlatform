const express = require("express");
const router = express.Router();

const { registerUser, loginUser, getMe } = require("../Controllers/userAuth");
const { protectUser } = require("../middleware/userAuthMiddleware");
const Course = require("../Models/course");
const Lecture = require("../Models/lecture");
const Enrollment = require("../Models/enrollment");

// Auth
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", protectUser, getMe);

// Courses — browse published courses
router.get("/courses", async (req, res) => {
  try {
    const courses = await Course.find({ publishStatus: "Published" }).sort({ createdAt: -1 });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/courses/:id", async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Lectures — view lectures for a course
router.get("/courses/:id/lectures", protectUser, async (req, res) => {
  try {
    const lectures = await Lecture.find({ courseId: req.params.id, isBlocked: false }).sort({ order: 1 });
    res.json(lectures);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Enrollment — enroll in a course
router.post("/courses/:id/enroll", protectUser, async (req, res) => {
  try {
    const existing = await Enrollment.findOne({ userId: req.user._id, courseId: req.params.id });
    if (existing) return res.status(409).json({ message: "Already enrolled" });

    const enrollment = await Enrollment.create({
      userId: req.user._id,
      courseId: req.params.id,
      enrollmentType: "self",
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    });

    res.status(201).json(enrollment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// My enrollments
router.get("/my-enrollments", protectUser, async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ userId: req.user._id }).populate("courseId");
    res.json(enrollments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
