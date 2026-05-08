const EducationalCenter = require("../Models/EducationalCenter");

function getSizeFilter(size) {
  if (size === "large") {
    return { activeStudents: { $gte: 2000 } };
  }

  if (size === "medium") {
    return {
      activeStudents: {
        $gte: 1000,
        $lt: 2000,
      },
    };
  }

  if (size === "small") {
    return { activeStudents: { $lt: 1000 } };
  }

  return {};
}

const getEducationalCenters = async function (req, res) {
  try {
    const { search, status, city, size } = req.query;

    const filter = {};

    if (search) {
      const regex = new RegExp(search, "i");

      filter.$or = [
        { name: regex },
        { centerCode: regex },
        { country: regex },
        { city: regex },
        { assignedManager: regex },
        { operatingModel: regex },
      ];
    }

    if (status) {
      filter.status = status;
    }

    if (city) {
      filter.city = city;
    }

    Object.assign(filter, getSizeFilter(size));

    const centers = await EducationalCenter.find(filter).sort({
      createdAt: -1,
    });

    return res.status(200).json(centers);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to get educational centers",
      error: error.message,
    });
  }
};

const getEducationalCenterStats = async function (req, res) {
  try {
    const totalCenters = await EducationalCenter.countDocuments();

    const activeStudentsResult = await EducationalCenter.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$activeStudents" },
        },
      },
    ]);

    const certificationResult = await EducationalCenter.aggregate([
      {
        $group: {
          _id: null,
          average: { $avg: "$certificationRate" },
        },
      },
    ]);

    const countries = await EducationalCenter.distinct("country");

    return res.status(200).json({
      totalCenters,
      activeStudents: activeStudentsResult[0]?.total || 0,
      certificationRate: Math.round(certificationResult[0]?.average || 0),
      globalReach: countries.filter(Boolean).length,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to get center stats",
      error: error.message,
    });
  }
};

const getEducationalCenterById = async function (req, res) {
  try {
    const center = await EducationalCenter.findById(req.params.id);

    if (!center) {
      return res.status(404).json({
        message: "Educational center not found",
      });
    }

    return res.status(200).json(center);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to get educational center",
      error: error.message,
    });
  }
};

const createEducationalCenter = async function (req, res) {
  try {
    const center = await EducationalCenter.create(req.body);

    return res.status(201).json(center);
  } catch (error) {
    return res.status(400).json({
      message: "Failed to create educational center",
      error: error.message,
    });
  }
};

const updateEducationalCenter = async function (req, res) {
  try {
    const center = await EducationalCenter.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!center) {
      return res.status(404).json({
        message: "Educational center not found",
      });
    }

    return res.status(200).json(center);
  } catch (error) {
    return res.status(400).json({
      message: "Failed to update educational center",
      error: error.message,
    });
  }
};

const deleteEducationalCenter = async function (req, res) {
  try {
    const center = await EducationalCenter.findByIdAndDelete(req.params.id);

    if (!center) {
      return res.status(404).json({
        message: "Educational center not found",
      });
    }

    return res.status(200).json({
      message: "Educational center deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete educational center",
      error: error.message,
    });
  }
};

module.exports = {
  getEducationalCenters,
  getEducationalCenterStats,
  getEducationalCenterById,
  createEducationalCenter,
  updateEducationalCenter,
  deleteEducationalCenter,
};