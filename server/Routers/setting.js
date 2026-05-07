const express = require("express");
const router = express.Router();

const {
  getSettings,
  updateGeneralSettings,
  updateSecuritySettings,
  updateNotificationSettings,
  manualBackup,
  restoreData,
} = require("../Controllers/Setting");

router.get("/", getSettings);
router.put("/general", updateGeneralSettings);
router.put("/security", updateSecuritySettings);
router.put("/notifications", updateNotificationSettings);
router.post("/backup", manualBackup);
router.post("/restore", restoreData);

module.exports = router;