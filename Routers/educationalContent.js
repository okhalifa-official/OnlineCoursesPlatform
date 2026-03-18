const express = require('express');
const router = express.Router();
const educationalContentController = require('../Controllers/educationalContent');

router.post("/create", educationalContentController.createEducationalContent);
router.get("/getalleducationalcontents", educationalContentController.getAllEducationalContent);
router.get("/geteducationalcontent/:id", educationalContentController.getEducationalContentById);
router.put("/updateeducationalcontent/:id", educationalContentController.updateEducationalContent);
router.delete("/deleteeducationalcontent/:id", educationalContentController.deleteEducationalContent);

module.exports = router;