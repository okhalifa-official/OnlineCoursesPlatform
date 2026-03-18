const EducationalContent = require('../Models/educationalContent');

const createEducationalContent = async (req, res) => {
  try {
    if (
      !req.body.title ||
      !req.body.description ||
      !req.body.type ||
      !req.body.link
    ) {
      return res.status(400).send({
        message:
          'Send all required fields: title, description, type, link',
      });
    }
    const newEducationalContent = {
      title: req.body.title,
      description: req.body.description,
      type: req.body.type,
      link: req.body.link,
    };

    const educationalContent = await EducationalContent.create(newEducationalContent);

    return res.status(201).send(educationalContent);
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ message: error.message });
    }
};

const getAllEducationalContent = async (req, res) => {
  try {
    const educationalContents = await EducationalContent.find({});

    return res.status(200).json({
      count: educationalContents.length,
      data: educationalContents,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send({ message: error.message });
  }
};

const getEducationalContentById = async (req, res) => {
  try {
    const { id } = req.params;

    const educationalContent = await EducationalContent.findById(id);

    return res.status(200).send(educationalContent);
  } catch (error) {
    console.log(error.message);
    res.status(500).send({ message: error.message });
  }
};

const updateEducationalContent = async (req, res) => {
  try {
    const { id } = req.params;

    if (
      !req.body.title ||
      !req.body.description ||
      !req.body.type ||
      !req.body.link
    ) {
      return res.status(400).send({
        message:
          'Send all required fields: title, description, type, link',
      });
    }

    const updatedEducationalContent = await EducationalContent.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    );

    if (!updatedEducationalContent) {
      return res.status(404).send({ message: 'Educational content not found' });
    }

    return res.status(200).send(updatedEducationalContent);
  } catch (error) {
    console.log(error.message);
    res.status(500).send({ message: error.message });
  }
};

const deleteEducationalContent = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedEducationalContent = await EducationalContent.findByIdAndDelete(id);

    if (!deletedEducationalContent) {
      return res.status(404).send({ message: 'Educational content not found' });
    }

    return res.status(200).send({ message: 'Educational content deleted successfully' });
  } catch (error) {
    console.log(error.message);
    res.status(500).send({ message: error.message });
  }
};

module.exports = {
  createEducationalContent,
  getAllEducationalContent,
  getEducationalContentById,
  updateEducationalContent,
  deleteEducationalContent,
};