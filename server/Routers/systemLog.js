const express = require("express");
const router = express.Router();

const {
  getSystemLogs,
  getSystemLogById,
  getSystemLogStats,
} = require("../Controllers/SystemLog");

router.get("/", getSystemLogs);
router.get("/stats", getSystemLogStats);
router.get("/:id", getSystemLogById);

module.exports = router;