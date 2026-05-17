const express = require("express");
const router = express.Router();

const {
  getPageContentMeta,
  getAllPageContents,
  getPageContentByKey,
  updatePageContent,
} = require("../Controllers/pageContent");

router.get("/meta", getPageContentMeta);
router.get("/", getAllPageContents);
router.get("/:pageKey", getPageContentByKey);
router.put("/:pageKey", updatePageContent);

module.exports = router;