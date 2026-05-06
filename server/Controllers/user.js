const bcrypt = require("bcryptjs");
const User = require("../Models/User");

function normalizeUserData(data) {
  const normalized = { ...data };

  if (normalized.role) {
    normalized.role = String(normalized.role).toLowerCase();
  }

  if (normalized.status) {
    normalized.status = String(normalized.status).toLowerCase();
  }

  if (normalized.email) {
    normalized.email = String(normalized.email).toLowerCase().trim();
  }

  if (normalized.username) {
    normalized.username = String(normalized.username).toLowerCase().trim();
  }

  if (!normalized.fullName && normalized.name) {
    normalized.fullName = normalized.name;
  }

  if (!normalized.name && normalized.fullName) {
    normalized.name = normalized.fullName;
  }

  if (normalized.role === "admin") {
    normalized.adminLevel = normalized.adminLevel || "admin";
    normalized.permissionsLevel = normalized.permissionsLevel || "full";
  } else {
    normalized.adminLevel = "none";
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

    if (!userData.username) {
      return res.status(400).json({
        message: "Username is required",
      });
    }

    if (!userData.password) {
      return res.status(400).json({
        message: "Password is required",
      });
    }

    if (
      userData.role === "admin" &&
      req.user.adminLevel !== "super_admin"
    ) {
      return res.status(403).json({
        message: "Only super admin can create admin accounts",
      });
    }

    if (
      userData.role === "admin" &&
      userData.adminLevel === "super_admin"
    ) {
      return res.status(403).json({
        message: "You cannot create another super admin from Add User",
      });
    }

    userData.passwordHash = await bcrypt.hash(userData.password, 12);
    delete userData.password;
    delete userData.confirmPassword;

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
    const oldUser = await User.findById(req.params.id);

    if (!oldUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const updateData = normalizeUserData(req.body);

    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    delete updateData.__v;
    delete updateData.passwordHash;

    if (
      oldUser.adminLevel === "super_admin" &&
      req.user.adminLevel !== "super_admin"
    ) {
      return res.status(403).json({
        message: "Only super admin can edit super admin",
      });
    }

    if (
      updateData.role === "admin" &&
      req.user.adminLevel !== "super_admin"
    ) {
      return res.status(403).json({
        message: "Only super admin can update admin accounts",
      });
    }

    if (
      oldUser.adminLevel === "super_admin" &&
      updateData.adminLevel !== "super_admin"
    ) {
      return res.status(403).json({
        message: "Super admin level cannot be removed from this account",
      });
    }

    if (updateData.password) {
      updateData.passwordHash = await bcrypt.hash(updateData.password, 12);
      delete updateData.password;
      delete updateData.confirmPassword;
    }

    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

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
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.adminLevel === "super_admin") {
      return res.status(403).json({
        message: "Super admin cannot be deleted",
      });
    }

    if (user.role === "admin" && req.user.adminLevel !== "super_admin") {
      return res.status(403).json({
        message: "Only super admin can delete admin accounts",
      });
    }

    await User.findByIdAndDelete(req.params.id);

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
      role: "instructor",
      status: "pending",
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
        adminLevel: "none",
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
        adminLevel: "none",
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