const express = require("express");
const router = express.Router();

const { getReportsOverview } = require("../Controllers/Report");

router.get("/overview", getReportsOverview);

module.exports = router;