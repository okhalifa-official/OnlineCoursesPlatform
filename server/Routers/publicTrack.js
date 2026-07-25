const express = require("express");
const router = express.Router();

const Track = require("../Models/Track");

router.get("/", async (req, res) => {
  try {
    const tracks = await Track.find({})
      .select("name slug description color")
      .sort({ name: 1 });

    res.json(tracks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
