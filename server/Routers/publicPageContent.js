const express = require("express");
const router = express.Router();

const {
  getPublicPageContentByKey,
} = require("../Controllers/pageContent");

router.get("/:pageKey", getPublicPageContentByKey);

module.exports = router;