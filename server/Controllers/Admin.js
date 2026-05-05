const bcrypt = require("bcryptjs");
const Admin = require("../Models/Admin");
const AdminRole = require("../Models/AdminRole");

async function getOrCreateAdminRole() {
  let role = await AdminRole.findOne();

  if (!role) {
    role = await AdminRole.create({});
  }

  return role;
}

const getAdminProfile = async function (req, res) {
  try {
    res.json(req.admin);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get admin profile",
      error: error.message,
    });
  }
};

const updateAdminProfile = async function (req, res) {
  try {
    const updateData = { ...req.body };

    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    delete updateData.__v;
    delete updateData.passwordHash;

    if (updateData.password) {
      updateData.passwordHash = await bcrypt.hash(updateData.password, 12);
      delete updateData.password;
    }

    const updatedAdmin = await Admin.findByIdAndUpdate(
      req.admin._id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    res.json(updatedAdmin);
  } catch (error) {
    res.status(400).json({
      message: "Failed to update admin profile",
      error: error.message,
    });
  }
};

const getAdminRole = async function (req, res) {
  try {
    const role = await getOrCreateAdminRole();

    res.json(role);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get admin role",
      error: error.message,
    });
  }
};

const updateAdminRole = async function (req, res) {
  try {
    const currentRole = await getOrCreateAdminRole();

    const updateData = { ...req.body };

    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    delete updateData.__v;

    const updatedRole = await AdminRole.findByIdAndUpdate(
      currentRole._id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    res.json(updatedRole);
  } catch (error) {
    res.status(400).json({
      message: "Failed to update admin role",
      error: error.message,
    });
  }
};

module.exports = {
  getAdminProfile,
  updateAdminProfile,
  getAdminRole,
  updateAdminRole,
};