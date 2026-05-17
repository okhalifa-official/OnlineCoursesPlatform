const express = require("express")

const { handleKashierWebhook } = require("../Controllers/kashierPayment")

const router = express.Router()

router.post("/kashier/webhook", handleKashierWebhook)

module.exports = router