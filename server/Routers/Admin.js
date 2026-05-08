const express = require("express");
const router = express.Router();

const {
  getAdminProfile,
  updateAdminProfile,
  getAdminRole,
  updateAdminRole,
} = require("../Controllers/Admin");

const {
  protect,
  requireAdmin,
  requireSuperAdmin,
} = require("../middleware/authMiddleware");

router.get("/profile", protect, requireAdmin, getAdminProfile);
router.put("/profile", protect, requireAdmin, updateAdminProfile);

router.get("/role", protect, requireSuperAdmin, getAdminRole);
router.put("/role", protect, requireSuperAdmin, updateAdminRole);

module.exports = router;