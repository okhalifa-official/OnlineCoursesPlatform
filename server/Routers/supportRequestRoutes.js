const express = require("express");
const router = express.Router();

const {
  createSupportRequest,
  getSupportRequests,
  updateSupportRequest,
  deleteSupportRequest,
} = require("../Controllers/supportRequest");

router.post("/", createSupportRequest);
router.get("/", getSupportRequests);
router.patch("/:id", updateSupportRequest);
router.delete("/:id", deleteSupportRequest);

module.exports = router;