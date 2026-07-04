const express = require("express");
const { listMyNotifications, markAllRead, markOneRead } = require("../Controllers/notifications");
const { protectUser } = require("../middleware/userAuthMiddleware");

const router = express.Router();

router.use(protectUser);

router.get("/", listMyNotifications);
router.post("/read-all", markAllRead);
router.post("/:id/read", markOneRead);

module.exports = router;
