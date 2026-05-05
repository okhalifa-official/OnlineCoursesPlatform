const express = require("express");
const router = express.Router();

const {
  getAdminProfile,
  updateAdminProfile,
  getAdminRole,
  updateAdminRole,
} = require("../Controllers/Admin");

const { protectAdmin } = require("../middleware/authMiddleware");

router.get("/profile", protectAdmin, getAdminProfile);
router.put("/profile", protectAdmin, updateAdminProfile);

router.get("/role", protectAdmin, getAdminRole);
router.put("/role", protectAdmin, updateAdminRole);

module.exports = router;