const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");

const { buildReusablePendingPaymentFilter } = require("./kashierPayment");

// createCheckoutSession's "reuse a pending checkout" optimization must never
// hand back a session created in a different currency than the one the
// visitor is currently resolved to (see server/Controllers/kashierPayment.js).
// createHostedPaymentSession/getEgpPerUsd are destructured at module load
// time in kashierPayment.js, which makes them unmockable via property
// reassignment from a test module (reassigning the exporting module's
// property does not change the already-bound local const in the consumer).
// A true end-to-end test would need a real/mocked MongoDB and network calls,
// neither of which exist in this repo's test setup. Instead we test the
// exact filter-construction logic used by both reuse lookup sites directly,
// which is the part of the code the bug actually lived in and the part the
// fix actually changes.
test("reusable-pending-payment filter includes courseId, userId, status, expiry, and currency", () => {
  const courseId = new mongoose.Types.ObjectId().toString();
  const userId = new mongoose.Types.ObjectId();

  const filter = buildReusablePendingPaymentFilter({
    courseId,
    userId,
    currency: "USD",
  });

  assert.equal(filter.courseId, courseId);
  assert.equal(filter.userId, userId);
  assert.equal(filter.status, "pending");
  assert.equal(filter.currency, "USD");
  assert.ok(filter.checkoutExpiresAt.$gt instanceof Date);
});

test("reusable-pending-payment filter scopes to EGP when resolved currency is EGP", () => {
  const courseId = new mongoose.Types.ObjectId().toString();
  const userId = new mongoose.Types.ObjectId();

  const filter = buildReusablePendingPaymentFilter({
    courseId,
    userId,
    currency: "EGP",
  });

  assert.equal(filter.currency, "EGP");
});

test("reusable-pending-payment filter for one currency would not match a payment stored in another currency", () => {
  // Simulates the bug scenario directly against the filter shape: a pending
  // payment was persisted in EGP, the visitor is now resolved to USD, so the
  // filter used to look up a reusable session must exclude the EGP record.
  const courseId = new mongoose.Types.ObjectId().toString();
  const userId = new mongoose.Types.ObjectId();

  const storedPayment = {
    courseId,
    userId,
    status: "pending",
    currency: "EGP",
    checkoutExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
  };

  const filter = buildReusablePendingPaymentFilter({
    courseId,
    userId,
    currency: "USD",
  });

  // A minimal in-memory match against the filter's simple equality fields
  // (mirrors what MongoDB would evaluate for these fields).
  const matches =
    String(filter.courseId) === String(storedPayment.courseId) &&
    String(filter.userId) === String(storedPayment.userId) &&
    filter.status === storedPayment.status &&
    filter.currency === storedPayment.currency;

  assert.equal(
    matches,
    false,
    "a USD-scoped reuse filter must not match an EGP-currency pending payment"
  );
});
