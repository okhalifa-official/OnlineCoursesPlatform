const express = require("express");
const router = express.Router();

const User = require("../Models/user");

const {
  protect,
  requireAdmin,
} = require("../middleware/authMiddleware");

router.patch("/me", protect, requireAdmin, async function (req, res) {
  try {
    const authUser = req.user || req.admin || req.auth || {};

    const userId =
      authUser._id ||
      authUser.id ||
      authUser.userId ||
      authUser.adminId;

    const email = authUser.email;
    const username = authUser.username;

    const filter = {};

    if (userId) {
      filter._id = userId;
    } else if (email) {
      filter.email = String(email).toLowerCase();
    } else if (username) {
      filter.username = String(username).toLowerCase();
    } else {
      return res.status(400).json({
        message: "Cannot identify logged in admin",
        authUser,
      });
    }

    const updatedUser = await User.findOneAndUpdate(
      filter,
      {
        $set: {
          role: "admin",
          adminLevel: "super_admin",
          accessLevel: "Super Admin",
          permissionsLevel: "full",
        },
      },
      {
        new: true,
      }
    ).select(
      "fullName name email username role adminLevel accessLevel permissionsLevel"
    );

    if (!updatedUser) {
      return res.status(404).json({
        message: "Logged in admin not found",
      });
    }

    return res.status(200).json({
      message: "Current admin is now super admin",
      user: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fix super admin",
      error: error.message,
    });
  }
});

module.exports = router;