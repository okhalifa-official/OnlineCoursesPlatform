const express = require("express");
const router = express.Router();

const Enrollment = require("../Models/enrollment");
const Course = require("../Models/course");

const {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  archiveCourse,
  restoreCourse,
} = require("../Controllers/course");

router.get("/", getCourses);
router.post("/", createCourse);

router.patch("/:id/archive", archiveCourse);
router.patch("/:id/restore", restoreCourse);

// Admin: list every student enrolled in a course with their progress and
// exam attempt stats. Used by the Manage Students page.
router.get("/:id/students", async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).select("modules exam");
    if (!course) return res.status(404).json({ message: "Course not found" });

    const totalLectures =
      Array.isArray(course.modules)
        ? course.modules.reduce(
            (sum, m) => sum + (m.lessons?.length || 0),
            0
          )
        : 0;

    const enrollments = await Enrollment.find({ courseId: req.params.id })
      .populate("userId", "fullName email role profileImage")
      .sort({ enrollmentDate: -1 });

    const rows = enrollments.map((e) => {
      const completed =
        e.completedLessons instanceof Map
          ? Array.from(e.completedLessons.values()).filter(Boolean).length
          : 0;

      return {
        _id: e._id,
        user: e.userId,
        enrollmentDate: e.enrollmentDate,
        enrollmentType: e.enrollmentType,
        status: e.status,
        completedLectures: completed,
        totalLectures,
        progressPercent:
          totalLectures === 0
            ? 0
            : Math.round((completed / totalLectures) * 100),
        examAttemptsUsed: e.examAttemptsUsed || 0,
        examMaxAttempts: Math.max(1, Number(course.exam?.attempts) || 1),
        examBestScore: e.examBestScore || 0,
        examPassed: !!e.examPassed,
        hasCertificate: !!(e.certificate?.data),
        certificateUploadedAt: e.certificate?.uploadedAt || null,
      };
    });

    res.json({
      course: {
        _id: course._id,
        totalLectures,
        examEnabled: !!course.exam?.enabled,
        examMaxAttempts: Math.max(1, Number(course.exam?.attempts) || 1),
        examPassingScore: Number(course.exam?.passingScore) || 0,
      },
      students: rows,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: reset a single student's exam attempts so they can retake.
router.patch("/:id/students/:enrollmentId/reset-attempts", async (req, res) => {
  try {
    const enrollment = await Enrollment.findOneAndUpdate(
      { _id: req.params.enrollmentId, courseId: req.params.id },
      { $set: { examAttemptsUsed: 0 } },
      { new: true }
    );
    if (!enrollment) return res.status(404).json({ message: "Enrollment not found" });
    res.json(enrollment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: upload a certificate file for a specific student.
// Accepts JSON body: { name, mimeType, data } where data is base64.
router.post("/:id/students/:enrollmentId/certificate", async (req, res) => {
  try {
    const { name, mimeType, data } = req.body || {};
    if (!name || !mimeType || !data) {
      return res.status(400).json({ message: "name, mimeType, and data are required" });
    }
    const uploadedAt = new Date();
    const year = uploadedAt.getFullYear();
    const code = `SS-${year}-${req.params.enrollmentId.slice(-6).toUpperCase()}`;
    const enrollment = await Enrollment.findOneAndUpdate(
      { _id: req.params.enrollmentId, courseId: req.params.id },
      { $set: { certificate: { name, mimeType, data, uploadedAt }, certificateCode: code } },
      { new: true }
    );
    if (!enrollment) return res.status(404).json({ message: "Enrollment not found" });
    res.json({ ok: true, uploadedAt: enrollment.certificate.uploadedAt, certificateCode: code });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: remove a previously uploaded certificate.
router.delete("/:id/students/:enrollmentId/certificate", async (req, res) => {
  try {
    const enrollment = await Enrollment.findOneAndUpdate(
      { _id: req.params.enrollmentId, courseId: req.params.id },
      { $set: { certificate: { data: null, mimeType: null, name: null, uploadedAt: null }, certificateCode: null } },
      { new: true }
    );
    if (!enrollment) return res.status(404).json({ message: "Enrollment not found" });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: revoke (delete) a student's enrollment.
router.delete("/:id/students/:enrollmentId", async (req, res) => {
  try {
    const result = await Enrollment.findOneAndDelete({
      _id: req.params.enrollmentId,
      courseId: req.params.id,
    });
    if (!result) return res.status(404).json({ message: "Enrollment not found" });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", getCourseById);
router.put("/:id", updateCourse);
router.delete("/:id", deleteCourse);

module.exports = router;