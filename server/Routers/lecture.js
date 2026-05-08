const express = require('express');
const router = express.Router();
const lectureController = require('../Controllers/lecture');

router.post("/", lectureController.createLecture);
router.get("/", lectureController.getAllLectures);
router.get("/:id", lectureController.getLectureById);
router.put("/:id", lectureController.updateLecture);
router.delete("/:id", lectureController.deleteLecture);

module.exports = router;
