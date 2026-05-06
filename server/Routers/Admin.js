const express = require("express");
const router = express.Router();

const {
  getAdminProfile,
  updateAdminProfile,
  getAdminRole,
  updateAdminRole,
} = require("../Controllers/Admin");

const { protect, requireAdmin } = require("../middleware/authMiddleware");

router.get("/profile", protect, requireAdmin, getAdminProfile);
router.put("/profile", protect, requireAdmin, updateAdminProfile);

router.get("/role", protect, requireAdmin, getAdminRole);
router.put("/role", protect, requireAdmin, updateAdminRole);

module.exports = router;