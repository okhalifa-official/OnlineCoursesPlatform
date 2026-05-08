const bcrypt = require("bcryptjs");
const User = require("../Models/user");
const AdminRole = require("../Models/AdminRole");

function getCurrentUserId(req) {
  return req.user?._id || req.user?.id || req.user?.userId;
}

async function getOrCreateAdminRole() {
  let role = await AdminRole.findOne();

  if (!role) {
    role = await AdminRole.create({});
  }

  return role;
}

const getAdminProfile = async function (req, res) {
  try {
    const currentUserId = getCurrentUserId(req);

    if (!currentUserId) {
      return res.status(401).json({
        message: "Not authorized",
      });
    }

    const admin = await User.findById(currentUserId).select("-passwordHash");

    if (!admin) {
      return res.status(404).json({
        message: "Admin not found",
      });
    }

    if (admin.role !== "admin") {
      return res.status(403).json({
        message: "This profile is for admins only",
      });
    }
    console.log("ADMIN PROFILE RETURNED:", {
      tokenUserId: req.user?._id?.toString(),
      profileUserId: admin._id?.toString(),
      username: admin.username,
      email: admin.email,
      role: admin.role,
      adminLevel: admin.adminLevel,
    });
    return res.status(200).json(admin);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to get admin profile",
      error: error.message,
    });
  }
};

const updateAdminProfile = async function (req, res) {
  try {
    const currentUserId = getCurrentUserId(req);

    if (!currentUserId) {
      return res.status(401).json({
        message: "Not authorized",
      });
    }

    const updateData = { ...req.body };

    delete updateData._id;
    delete updateData.id;
    delete updateData.userId;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    delete updateData.__v;
    delete updateData.passwordHash;
    delete updateData.role;
    delete updateData.adminLevel;
    delete updateData.status;

    if (updateData.email) {
      updateData.email = String(updateData.email).toLowerCase().trim();
    }

    if (updateData.username) {
      updateData.username = String(updateData.username).toLowerCase().trim();
    }

    if (updateData.firstName || updateData.lastName) {
      updateData.fullName = `${updateData.firstName || ""} ${
        updateData.lastName || ""
      }`.trim();

      updateData.name = updateData.fullName;
    }

    if (updateData.image) {
      updateData.profileImage = updateData.image;
      delete updateData.image;
    }

    if (updateData.bio) {
      updateData.notes = updateData.bio;
      delete updateData.bio;
    }

    if (updateData.password) {
      updateData.passwordHash = await bcrypt.hash(updateData.password, 12);
      delete updateData.password;
      delete updateData.confirmPassword;
    }

    const updatedAdmin = await User.findByIdAndUpdate(
      currentUserId,
      updateData,
      {
        new: true,
        runValidators: true,
      },
    ).select("-passwordHash");

    if (!updatedAdmin) {
      return res.status(404).json({
        message: "Admin not found",
      });
    }

    return res.status(200).json(updatedAdmin);
  } catch (error) {
    return res.status(400).json({
      message: "Failed to update admin profile",
      error: error.message,
    });
  }
};

const getAdminRole = async function (req, res) {
  try {
    const role = await getOrCreateAdminRole();

    return res.status(200).json(role);
  } catch (error) {
    return res.status(500).json({
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
      },
    );

    return res.status(200).json(updatedRole);
  } catch (error) {
    return res.status(400).json({
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
