const express = require('express');
const router = express.Router();
const courseController = require('../Controllers/course');

router.post("/create", courseController.createCourse);
router.get("/getallcourses", courseController.getAllCourses);
router.get("/getcourse/:id", courseController.getCourseById);
router.put("/updatecourse/:id", courseController.updateCourse);
router.delete("/deletecourse/:id", courseController.deleteCourse);

module.exports = router;