const Course = require("../Models/Course");

const getCourses = async function (req, res) {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    res.json(courses);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get courses",
      error: error.message,
    });
  }
};

const getCourseById = async function (req, res) {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        message: "Course not found",
      });
    }

    res.json(course);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get course",
      error: error.message,
    });
  }
};

const createCourse = async function (req, res) {
  try {
    const course = await Course.create(req.body);

    res.status(201).json(course);
  } catch (error) {
    res.status(400).json({
      message: "Failed to create course",
      error: error.message,
    });
  }
};

const updateCourse = async function (req, res) {
  try {
    const updateData = { ...req.body };

    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    delete updateData.__v;

    const course = await Course.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!course) {
      return res.status(404).json({
        message: "Course not found",
      });
    }

    res.json(course);
  } catch (error) {
    res.status(400).json({
      message: "Failed to update course",
      error: error.message,
    });
  }
};

const deleteCourse = async function (req, res) {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);

    if (!course) {
      return res.status(404).json({
        message: "Course not found",
      });
    }

    res.json({
      message: "Course deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete course",
      error: error.message,
    });
  }
};

const archiveCourse = async function (req, res) {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { publishStatus: "Archived" },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!course) {
      return res.status(404).json({
        message: "Course not found",
      });
    }

    res.json({
      message: "Course archived successfully",
      course,
    });
  } catch (error) {
    res.status(400).json({
      message: "Failed to archive course",
      error: error.message,
    });
  }
};

const restoreCourse = async function (req, res) {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { publishStatus: "Draft" },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!course) {
      return res.status(404).json({
        message: "Course not found",
      });
    }

    res.json({
      message: "Course restored successfully",
      course,
    });
  } catch (error) {
    res.status(400).json({
      message: "Failed to restore course",
      error: error.message,
    });
  }
};

module.exports = {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  archiveCourse,
  restoreCourse,
};