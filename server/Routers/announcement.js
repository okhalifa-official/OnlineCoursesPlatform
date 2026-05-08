const express = require("express");
const router = express.Router();

const {
  getAnnouncementMeta,
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
} = require("../Controllers/announcement");

router.get("/meta", getAnnouncementMeta);
router.get("/", getAnnouncements);
router.post("/", createAnnouncement);
router.delete("/:id", deleteAnnouncement);

module.exports = router;
