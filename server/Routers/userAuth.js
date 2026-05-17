const express = require("express");
const router = express.Router();

const { registerUser, loginUser, getMe, updateUserProfile, changePassword } = require("../Controllers/userAuth");
const { protectUser } = require("../middleware/userAuthMiddleware");
const Course = require("../Models/course");
const Lecture = require("../Models/lecture");
const Enrollment = require("../Models/enrollment");
const Review = require("../Models/review");

// Auth
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", protectUser, getMe);
router.put("/profile", protectUser, updateUserProfile);
router.put("/change-password", protectUser, changePassword);

// Courses — browse published courses
router.get("/courses", async (req, res) => {
  try {
    const courses = await Course.find({ publishStatus: "Published" }).sort({
      createdAt: -1,
    });
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

// Enrollment — self-enroll in a course (only allowed for free courses)
router.post("/courses/:id/enroll", protectUser, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    if (Number(course.coursePrice) > 0) {
      return res.status(402).json({ message: "Payment integration coming soon." });
    }

    const existing = await Enrollment.findOne({ userId: req.user._id, courseId: req.params.id });
    if (existing) return res.status(200).json(existing);

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

// My enrollments — full populated enrollments
router.get("/my-enrollments", protectUser, async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ userId: req.user._id }).populate("courseId");
    res.json(enrollments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// My enrolled course ids — small payload, used by listing pages to decide
// whether a card should link into /learn/:id (enrolled) or /courses/:id (preview)
router.get("/my-course-ids", protectUser, async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ userId: req.user._id }).select("courseId");
    res.json(enrollments.map((e) => String(e.courseId)));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Course content for an enrolled student — full course doc with modules and lessons.
router.get("/courses/:id/learn", protectUser, async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({
      userId: req.user._id,
      courseId: req.params.id,
    });
    if (!enrollment) return res.status(403).json({ message: "Not enrolled" });

    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Returns the student's enrollment record for a course (so the client knows
// how many exam attempts have been used, what their best score is, etc.)
router.get("/courses/:id/enrollment", protectUser, async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({
      userId: req.user._id,
      courseId: req.params.id,
    });
    if (!enrollment) return res.status(404).json({ message: "Not enrolled" });
    res.json(enrollment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Records an exam attempt. Caller submits {score} (percentage). The server
// caps this at the course's exam.attempts limit and returns the updated
// enrollment so the client can refresh its UI.
router.post("/courses/:id/exam-attempt", protectUser, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).select("exam");
    if (!course || !course.exam?.enabled) {
      return res.status(400).json({ message: "Exam is not enabled for this course" });
    }

    const enrollment = await Enrollment.findOne({
      userId: req.user._id,
      courseId: req.params.id,
    });
    if (!enrollment) return res.status(403).json({ message: "Not enrolled" });

    const maxAttempts = Math.max(1, Number(course.exam.attempts) || 1);
    if ((enrollment.examAttemptsUsed || 0) >= maxAttempts) {
      return res.status(409).json({ message: "No attempts remaining" });
    }

    const score = Math.max(0, Math.min(100, Number(req.body.score) || 0));
    const passingScore = Number(course.exam.passingScore) || 0;

    // The exam-taker can flag *why* the attempt ended (submitted on time,
    // timed-out, or disqualified for anti-cheat violations) so we can render
    // an honest result chip later.
    const allowedReasons = ["submitted", "timeout", "disqualified"];
    const reason = allowedReasons.includes(req.body.reason)
      ? req.body.reason
      : "submitted";

    enrollment.examAttemptsUsed = (enrollment.examAttemptsUsed || 0) + 1;
    enrollment.examLastScore = score;
    enrollment.examLastReason = reason;
    enrollment.examLastTakenAt = new Date();
    if (score > (enrollment.examBestScore || 0)) {
      enrollment.examBestScore = score;
    }
    if (score >= passingScore) {
      enrollment.examPassed = true;
    }
    await enrollment.save();

    res.json(enrollment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Persists lecture-completion state for a course. Body: { lessonId, done }.
// Used by the admin Manage Students page to surface a completion %.
router.put("/courses/:id/progress", protectUser, async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({
      userId: req.user._id,
      courseId: req.params.id,
    });
    if (!enrollment) return res.status(403).json({ message: "Not enrolled" });

    const { lessonId, done } = req.body || {};
    if (typeof lessonId !== "string") {
      return res.status(400).json({ message: "lessonId is required" });
    }

    if (!enrollment.completedLessons) enrollment.completedLessons = new Map();
    if (done) enrollment.completedLessons.set(lessonId, true);
    else enrollment.completedLessons.delete(lessonId);
    await enrollment.save();

    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── Reviews ─────────────────────────────────────────────────────────────────
// Public list — anyone visiting the course page sees what other students said.
router.get("/courses/:id/reviews", async (req, res) => {
  try {
    const reviews = await Review.find({ courseId: req.params.id })
      .populate("userId", "fullName profileImage")
      .sort({ createdAt: -1 });

    const ratings = reviews.map((r) => r.rating);
    const average =
      ratings.length === 0
        ? 0
        : Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) /
          10;

    res.json({
      count: reviews.length,
      average,
      reviews,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Submit / update a review. Only enrolled students can post.
router.post("/courses/:id/reviews", protectUser, async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({
      userId: req.user._id,
      courseId: req.params.id,
    });
    if (!enrollment) {
      return res
        .status(403)
        .json({ message: "Only enrolled students can review this course." });
    }

    const rating = Number(req.body.rating);
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be 1–5." });
    }
    const comment = (req.body.comment || "").toString().trim().slice(0, 2000);

    // Upsert so a student updating their review just edits the existing doc.
    const review = await Review.findOneAndUpdate(
      { courseId: req.params.id, userId: req.user._id },
      { $set: { rating, comment } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).populate("userId", "fullName profileImage");

    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete the caller's own review.
router.delete("/courses/:id/reviews", protectUser, async (req, res) => {
  try {
    const result = await Review.findOneAndDelete({
      courseId: req.params.id,
      userId: req.user._id,
    });
    if (!result) return res.status(404).json({ message: "Review not found" });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
