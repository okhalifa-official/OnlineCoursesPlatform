const express = require("express");
const router = express.Router();

const {
  getDashboardOverview,
  getNotifications,
  getAllNotifications,
  getRecentActivity,
  getAlerts,
  getPerformance,
} = require("../Controllers/dashboard");

router.get("/overview", getDashboardOverview);

router.get("/notifications", getNotifications);
router.get("/notifications/all", getAllNotifications);

router.get("/recent-activity", getRecentActivity);
router.get("/alerts", getAlerts);
router.get("/performance", getPerformance);

module.exports = router;