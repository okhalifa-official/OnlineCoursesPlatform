const express = require("express");
const router = express.Router();

const { loginAdmin, getMe } = require("../Controllers/Auth");

const {
  protect,
  requireAdmin,
} = require("../middleware/authMiddleware");

router.post("/admin/login", loginAdmin);
router.get("/admin/me", protect, requireAdmin, getMe);

module.exports = router;