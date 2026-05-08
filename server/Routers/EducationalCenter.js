const express = require("express");
const router = express.Router();

const {
  getEducationalCenters,
  getEducationalCenterStats,
  getEducationalCenterById,
  createEducationalCenter,
  updateEducationalCenter,
  deleteEducationalCenter,
} = require("../Controllers/EducationalCenter");

router.get("/", getEducationalCenters);
router.get("/stats", getEducationalCenterStats);
router.get("/:id", getEducationalCenterById);
router.post("/", createEducationalCenter);
router.put("/:id", updateEducationalCenter);
router.delete("/:id", deleteEducationalCenter);

module.exports = router;