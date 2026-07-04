const express = require("express")

const {
  createCheckoutSession,
  getPaymentStatus,
} = require("../Controllers/kashierPayment")
const {
  submitInstapayPayment,
  getInstapayConfig,
  listMyPaymentHistory,
} = require("../Controllers/instapayPayment")
const { protectUser } = require("../middleware/userAuthMiddleware")

const router = express.Router()

router.get("/instapay/config", getInstapayConfig)

router.use(protectUser)

router.post("/checkout-session", createCheckoutSession)
router.post("/instapay/submit", submitInstapayPayment)
router.get("/history", listMyPaymentHistory)
router.get("/:referenceNumber/status", getPaymentStatus)

module.exports = router