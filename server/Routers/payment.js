const express = require("express");
const router = express.Router();

const {
  getPaymentTransactions,
  getPaymentStats,
  getPaymentTransactionById,
  createPaymentTransaction,
  updatePaymentTransaction,
  updatePaymentStatus,
  refundPaymentTransaction,
  sendPaymentReminder,
  deletePaymentTransaction,
  getPaymentSettings,
  updatePaymentSettings,
  seedPaymentTransactions,
} = require("../Controllers/Payment");

const {
  listPendingInstapayReviews,
  approveInstapayPayment,
  rejectInstapayPayment,
} = require("../Controllers/instapayPayment");

/*
  IMPORTANT:
  Fixed routes must come before /:id
*/

router.get("/", getPaymentTransactions);
router.get("/stats", getPaymentStats);
router.post("/", createPaymentTransaction);

router.get("/settings", getPaymentSettings);
router.put("/settings", updatePaymentSettings);

router.post("/seed", seedPaymentTransactions);

router.get("/instapay/pending", listPendingInstapayReviews);
router.post("/instapay/:id/approve", approveInstapayPayment);
router.post("/instapay/:id/reject", rejectInstapayPayment);

router.get("/:id", getPaymentTransactionById);
router.put("/:id", updatePaymentTransaction);
router.patch("/:id/status", updatePaymentStatus);
router.patch("/:id/refund", refundPaymentTransaction);
router.post("/:id/reminder", sendPaymentReminder);
router.delete("/:id", deletePaymentTransaction);

module.exports = router;