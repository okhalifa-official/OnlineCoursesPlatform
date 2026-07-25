const express = require("express");
const router = express.Router();

const {
  getTracks,
  createTrack,
  updateTrack,
  deleteTrack,
} = require("../Controllers/Track");

router.get("/", getTracks);
router.post("/", createTrack);
router.put("/:id", updateTrack);
router.delete("/:id", deleteTrack);

module.exports = router;
