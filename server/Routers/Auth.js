const express = require("express");
const router = express.Router();

const { loginAdmin, getLoggedInAdmin } = require("../Controllers/Auth");
const { protectAdmin } = require("../middleware/authMiddleware");

router.post("/admin/login", loginAdmin);
router.get("/admin/me", protectAdmin, getLoggedInAdmin);

module.exports = router;