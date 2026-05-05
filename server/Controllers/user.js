const User = require("../Models/User");

function normalizeUserData(data) {
  const normalized = { ...data };

  if (normalized.role) {
    normalized.role = normalized.role.toLowerCase();
  }

  if (normalized.status) {
    normalized.status = normalized.status.toLowerCase();
  }

  return normalized;
}

const getUsers = async function (req, res) {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get users",
      error: error.message,
    });
  }
};

const getUserById = async function (req, res) {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get user",
      error: error.message,
    });
  }
};

const createUser = async function (req, res) {
  try {
    const userData = normalizeUserData(req.body);

    const user = await User.create(userData);

    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({
      message: "Failed to create user",
      error: error.message,
    });
  }
};

const updateUser = async function (req, res) {
  try {
    const updateData = normalizeUserData(req.body);

    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    delete updateData.__v;

    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json(user);
  } catch (error) {
    res.status(400).json({
      message: "Failed to update user",
      error: error.message,
    });
  }
};

const deleteUser = async function (req, res) {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json({
      message: "User deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete user",
      error: error.message,
    });
  }
};

const getPendingInstructors = async function (req, res) {
  try {
    const instructors = await User.find({
      role: { $in: ["instructor", "Instructor"] },
      status: { $in: ["pending", "Pending"] },
    }).sort({ createdAt: -1 });

    res.json(instructors);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get pending instructors",
      error: error.message,
    });
  }
};

const approveInstructor = async function (req, res) {
  try {
    const instructor = await User.findByIdAndUpdate(
      req.params.id,
      {
        role: "instructor",
        status: "active",
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!instructor) {
      return res.status(404).json({
        message: "Instructor not found",
      });
    }

    res.json({
      message: "Instructor approved successfully",
      instructor,
    });
  } catch (error) {
    res.status(400).json({
      message: "Failed to approve instructor",
      error: error.message,
    });
  }
};

const rejectInstructor = async function (req, res) {
  try {
    const instructor = await User.findByIdAndUpdate(
      req.params.id,
      {
        role: "instructor",
        status: "suspended",
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!instructor) {
      return res.status(404).json({
        message: "Instructor not found",
      });
    }

    res.json({
      message: "Instructor rejected successfully",
      instructor,
    });
  } catch (error) {
    res.status(400).json({
      message: "Failed to reject instructor",
      error: error.message,
    });
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getPendingInstructors,
  approveInstructor,
  rejectInstructor,
};