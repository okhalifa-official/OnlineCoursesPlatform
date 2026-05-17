const express = require("express")

const {
  createCheckoutSession,
  getPaymentStatus,
} = require("../Controllers/kashierPayment")
const { protectUser } = require("../middleware/userAuthMiddleware")

const router = express.Router()

router.use(protectUser)

router.post("/checkout-session", createCheckoutSession)
router.get("/:referenceNumber/status", getPaymentStatus)

module.exports = router