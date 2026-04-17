const Course = require('../Models/course');

const createCourse = async (req, res) => {
  try {
    if (
      !req.body.name ||
      !req.body.directors ||
      !req.body.price ||
      !req.body.accommodation ||
      !req.body.startDate ||
      !req.body.endDate ||
      !req.body.educationalContent ||
      !req.body.visibility
    ) {
      return res.status(400).send({
        message:
          'Send all required fields: name, directors, price, accommodation, startDate, endDate, educationalContent, visibility',
      });
    }

    const newCourse = {
      name: req.body.name,
      directors: req.body.directors,
      price: req.body.price,
      accommodation: req.body.accommodation,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      educationalContent: req.body.educationalContent,
      visibility: req.body.visibility,
    };

    const course = await Course.create(newCourse);

    return res.status(201).send(course);
  } catch (error) {
    console.log(error.message);
    res.status(500).send({ message: error.message });
  }
};

const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find({}).populate('educationalContent');

    return res.status(200).json({
      count: courses.length,
      data: courses,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send({ message: error.message });
  }
};

const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id).populate('educationalContent');
    
    return res.status(200).send(course);
  } catch (error) {
    console.log(error.message);
    res.status(500).send({ message: error.message });
  }
};

const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;

    if (
      !req.body.name ||
      !req.body.directors ||
      !req.body.price ||
      !req.body.accommodation ||
      !req.body.startDate ||
      !req.body.endDate ||
      !req.body.educationalContent ||
      !req.body.visibility
    ) {
      return res.status(400).send({
        message:
          'Send all required fields: name, directors, price, accommodation, startDate, endDate, educationalContent, visibility',
      });
    }
    
    const updatedCourse = {
        name: req.body.name,
        directors: req.body.directors,
        price: req.body.price,
        accommodation: req.body.accommodation,
        startDate: req.body.startDate,
        endDate: req.body.endDate,
        educationalContent: req.body.educationalContent,
        visibility: req.body.visibility,
    };

    const course = await Course.findByIdAndUpdate(id, updatedCourse, { new: true });
    if (!course) {
      return res.status(404).send({ message: 'Course not found' });
    }

    return res.status(200).send(course);
  } catch (error) {
    console.log(error.message);
    res.status(500).send({ message: error.message });
  }
};

const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedCourse = await Course.findByIdAndDelete(id);

    if (!deletedCourse) {
      return res.status(404).send({ message: 'Course not found' });
    }
    return res.status(200).send({ message: 'Course deleted successfully' });
  } catch (error) {
    console.log(error.message);
    res.status(500).send({ message: error.message });
  }
};

module.exports = {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
};