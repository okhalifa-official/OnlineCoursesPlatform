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

// Dashboard summary — lean data for the student home page
router.get("/dashboard", protectUser, async (req, res) => {
  try {
    const enrollments = await Enrollment.find({
      userId: req.user._id,
      status: "active",
    })
      .populate("courseId", "courseName category previewImage modules materials updatedAt")
      .sort({ updatedAt: -1 });

    const recentCerts = await Enrollment.find({
      userId: req.user._id,
      "certificate.data": { $ne: null, $exists: true },
    })
      .populate("courseId", "courseName category")
      .sort({ "certificate.uploadedAt": -1 })
      .limit(3);

    // Strip heavy base64 from modules/materials — client only needs metadata
    const leanEnrollments = enrollments.map((e) => {
      const obj = e.toObject();
      if (obj.courseId) {
        obj.courseId.modules = (obj.courseId.modules || []).map((m) => ({
          title: m.title,
          lessons: (m.lessons || []).map((l) => ({
            title: l.title,
            type: l.type,
            duration: l.duration,
          })),
        }));
        obj.courseId.materials = (obj.courseId.materials || []).map((m, idx) => ({
          name: m.name,
          mimeType: m.mimeType,
          sizeKB: m.sizeKB,
          idx,
        }));
      }
      return obj;
    });

    const leanCerts = recentCerts.map((e) => {
      const obj = e.toObject();
      if (obj.certificate) {
        const { data: _omit, ...certMeta } = obj.certificate;
        obj.certificate = certMeta;
      }
      return obj;
    });

    res.json({ enrollments: leanEnrollments, recentCerts: leanCerts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Download a specific material from an enrolled course
router.get("/courses/:id/materials/:idx", protectUser, async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({
      userId: req.user._id,
      courseId: req.params.id,
    });
    if (!enrollment) return res.status(403).json({ message: "Not enrolled" });

    const course = await Course.findById(req.params.id).select("materials");
    if (!course) return res.status(404).json({ message: "Course not found" });

    const idx = parseInt(req.params.idx, 10);
    const material = (course.materials || [])[idx];
    if (!material) return res.status(404).json({ message: "Material not found" });

    res.json({ name: material.name, mimeType: material.mimeType, data: material.data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// My certificates — enrollments where the admin has uploaded a certificate file
router.get("/my-certificates", protectUser, async (req, res) => {
  try {
    const passed = await Enrollment.find({
      userId: req.user._id,
      "certificate.data": { $ne: null, $exists: true },
    })
      .populate("courseId", "courseName category")
      .sort({ "certificate.uploadedAt": -1 });

    const inProgress = await Enrollment.find({
      userId: req.user._id,
      $or: [
        { "certificate.data": null },
        { "certificate.data": { $exists: false } },
      ],
      status: "active",
    })
      .populate("courseId", "courseName category modules")
      .sort({ enrollmentDate: -1 });

    // Strip base64 from the passed list — client only needs metadata for the
    // listing; actual file is fetched on demand via /my-certificates/:id/file
    const passedLean = passed.map((e) => {
      const obj = e.toObject();
      if (obj.certificate) {
        const { data: _omit, ...certMeta } = obj.certificate;
        obj.certificate = certMeta;
      }
      return obj;
    });

    res.json({
      passed: passedLean,
      inProgress: inProgress.filter((e) => e.courseId),
      studentName: req.user.fullName || "",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Download the actual certificate file for a specific enrollment
router.get("/my-certificates/:enrollmentId/file", protectUser, async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({
      _id: req.params.enrollmentId,
      userId: req.user._id,
      "certificate.data": { $ne: null, $exists: true },
    });
    if (!enrollment) return res.status(404).json({ message: "Certificate not found" });
    res.json({
      data:     enrollment.certificate.data,
      mimeType: enrollment.certificate.mimeType,
      name:     enrollment.certificate.name,
    });
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


// ─── Public certificate verification ─────────────────────────────────────────
// No auth required — anyone can verify a certificate by its code.

// Resolves an enrollment by certificate code. Tries the indexed field first;
// falls back to scanning by _id hex suffix for certs uploaded before the
// certificateCode field was introduced. Auto-heals the index on match.
async function findEnrollmentByCode(rawCode) {
  const code = rawCode.toUpperCase();
  const certFilter = { "certificate.data": { $exists: true, $ne: null } };

  // Fast path — indexed field
  let enrollment = await Enrollment.findOne({ certificateCode: code, ...certFilter });
  if (enrollment) return enrollment;

  // Slow-path fallback — parse the 6-char hex suffix from SS-YYYY-XXXXXX
  const match = code.match(/^SS-\d{4}-([A-F0-9]{6})$/i);
  if (!match) return null;
  const suffix = match[1].toLowerCase();

  const allWithCerts = await Enrollment.find(certFilter);
  enrollment = allWithCerts.find(
    (e) => e._id.toString().slice(-6).toLowerCase() === suffix
  ) || null;

  // Persist the code so future lookups are fast
  if (enrollment) {
    await Enrollment.updateOne({ _id: enrollment._id }, { certificateCode: code });
    enrollment.certificateCode = code;
  }

  return enrollment;
}

router.get("/verify/:code", async (req, res) => {
  try {
    const enrollment = await findEnrollmentByCode(req.params.code);
    if (!enrollment) {
      return res.status(404).json({ valid: false, message: "Certificate not found" });
    }

    await enrollment.populate("userId", "fullName");
    await enrollment.populate("courseId", "courseName category");

    res.json({
      valid:       true,
      code:        enrollment.certificateCode,
      studentName: enrollment.userId?.fullName       || "",
      courseName:  enrollment.courseId?.courseName   || "",
      category:    enrollment.courseId?.category     || "",
      issuedAt:    enrollment.certificate.uploadedAt,
      mimeType:    enrollment.certificate.mimeType,
      fileName:    enrollment.certificate.name,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/verify/:code/file", async (req, res) => {
  try {
    const enrollment = await findEnrollmentByCode(req.params.code);
    if (!enrollment) return res.status(404).json({ message: "Certificate not found" });

    res.json({
      data:     enrollment.certificate.data,
      mimeType: enrollment.certificate.mimeType,
      name:     enrollment.certificate.name,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
