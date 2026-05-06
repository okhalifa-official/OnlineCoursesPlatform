const Lecture = require('../Models/lecture');

const createLecture = async (req, res) => {
  try {
    if (!req.body.courseId || !req.body.title || !req.body.type || !req.body.videoURL) {
      return res.status(400).send({
        message: 'Send all required fields: courseId, title, type, videoURL',
      });
    }

    const lecture = await Lecture.create({
      courseId: req.body.courseId,
      title: req.body.title,
      description: req.body.description || "",
      videoURL: req.body.videoURL,
      type: req.body.type,
      order: req.body.order || 0,
      isBlocked: req.body.isBlocked || false,
      duration: req.body.duration || 0,
    });

    return res.status(201).send(lecture);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

const getAllLectures = async (req, res) => {
  try {
    const lectures = await Lecture.find({}).populate('courseId', 'courseName');

    return res.status(200).json({
      count: lectures.length,
      data: lectures,
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

const getLectureById = async (req, res) => {
  try {
    const lecture = await Lecture.findById(req.params.id).populate('courseId', 'courseName');

    if (!lecture) {
      return res.status(404).send({ message: 'Lecture not found' });
    }

    return res.status(200).send(lecture);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

const updateLecture = async (req, res) => {
  try {
    const updateData = { ...req.body };
    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    delete updateData.__v;

    const lecture = await Lecture.findByIdAndUpdate(req.params.id, updateData, { new: true });

    if (!lecture) {
      return res.status(404).send({ message: 'Lecture not found' });
    }

    return res.status(200).send(lecture);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

const deleteLecture = async (req, res) => {
  try {
    const lecture = await Lecture.findByIdAndDelete(req.params.id);

    if (!lecture) {
      return res.status(404).send({ message: 'Lecture not found' });
    }

    return res.status(200).send({ message: 'Lecture deleted successfully' });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

module.exports = {
  createLecture,
  getAllLectures,
  getLectureById,
  updateLecture,
  deleteLecture,
};
