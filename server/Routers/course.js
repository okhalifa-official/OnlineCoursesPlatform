const express = require("express");
const router = express.Router();

const {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  archiveCourse,
  restoreCourse,
} = require("../Controllers/Course");

router.get("/", getCourses);
router.post("/", createCourse);

router.patch("/:id/archive", archiveCourse);
router.patch("/:id/restore", restoreCourse);

router.get("/:id", getCourseById);
router.put("/:id", updateCourse);
router.delete("/:id", deleteCourse);

module.exports = router;