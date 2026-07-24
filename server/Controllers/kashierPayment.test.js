const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");

const {
  buildReusablePendingPaymentFilter,
  buildSupersedeStaleCurrencyPaymentFilter,
  buildSupersedeStaleCurrencyPaymentUpdate,
} = require("./kashierPayment");

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

// When createCheckoutSession hits the unique-index collision (11000) on
// Payment.create and the currency-scoped recovery lookup finds nothing, the
// payment blocking the unique-per-user-per-course "pending" slot must be a
// stale, opposite-currency pending payment (see server/Models/payment.js —
// the index is { userId, courseId } unique when status: "pending",
// regardless of currency). Rather than permanently 409-blocking a deliberate
// currency switch, that stale payment should be marked expired/superseded so
// the new-currency payment can be created on retry. This mirrors the
// status/failureReason convention already used both by the checkout-expiry
// sweep in kashierPayment.js and by InstaPay's supersede logic in
// instapayPayment.js ("Superseded by an InstaPay submission").
test("supersede update marks a stale-currency pending payment as expired with a descriptive failureReason", () => {
  const update = buildSupersedeStaleCurrencyPaymentUpdate({ currency: "USD" });

  assert.equal(update.$set.status, "expired");
  assert.equal(update.$set.gatewayStatus, "EXPIRED");
  assert.match(update.$set.failureReason, /superseded/i);
  assert.match(update.$set.failureReason, /USD/);
});

test("supersede update mentions the newly requested currency for EGP too", () => {
  const update = buildSupersedeStaleCurrencyPaymentUpdate({ currency: "EGP" });

  assert.match(update.$set.failureReason, /EGP/);
});

// The supersede filter above (courseId + opposite-currency + pending +
// userId) used to have no gateway guard, so it could match and silently
// expire an InstaPay submission that is legitimately pending manual admin
// review (InstaPay payments stay "pending" indefinitely with
// checkoutExpiresAt: null - see server/Controllers/instapayPayment.js's
// Payment.create call, which sets gateway: "instapay"). Kashier-created
// payments default to gateway: "kashier" (see server/Models/payment.js).
// Only a stale Kashier-originated pending payment is a plausible abandoned
// card-checkout attempt, so the filter must exclude gateway: "instapay" -
// mirroring the exact guard convention InstaPay's own supersede sweep
// already uses (gateway: { $ne: "instapay" } in instapayPayment.js).
test("supersede filter excludes InstaPay-originated payments so a pending review is never superseded", () => {
  const courseId = new mongoose.Types.ObjectId().toString();
  const userId = new mongoose.Types.ObjectId();

  const filter = buildSupersedeStaleCurrencyPaymentFilter({
    courseId,
    userId,
    currency: "USD",
  });

  assert.equal(filter.courseId, courseId);
  assert.equal(filter.userId, userId);
  assert.equal(filter.status, "pending");
  assert.deepEqual(filter.currency, { $ne: "USD" });
  assert.deepEqual(filter.gateway, { $ne: "instapay" });

  // Simulate the exact bug scenario: an InstaPay payment pending review,
  // same course/user, opposite (EGP) currency to the new USD checkout.
  const instapayPendingReview = {
    courseId,
    userId,
    status: "pending",
    currency: "EGP",
    gateway: "instapay",
    checkoutExpiresAt: null,
  };

  const matchesInstapayPayment =
    String(filter.courseId) === String(instapayPendingReview.courseId) &&
    String(filter.userId) === String(instapayPendingReview.userId) &&
    filter.status === instapayPendingReview.status &&
    filter.currency.$ne !== instapayPendingReview.currency &&
    filter.gateway.$ne !== instapayPendingReview.gateway;

  assert.equal(
    matchesInstapayPayment,
    false,
    "the supersede filter must not match an InstaPay payment pending admin review"
  );

  // A stale Kashier pending payment in the opposite currency should still
  // match, so the original supersede behavior for abandoned card checkouts
  // keeps working.
  const staleKashierPayment = {
    courseId,
    userId,
    status: "pending",
    currency: "EGP",
    gateway: "kashier",
    checkoutExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
  };

  const matchesStaleKashierPayment =
    String(filter.courseId) === String(staleKashierPayment.courseId) &&
    String(filter.userId) === String(staleKashierPayment.userId) &&
    filter.status === staleKashierPayment.status &&
    filter.currency.$ne !== staleKashierPayment.currency &&
    filter.gateway.$ne !== staleKashierPayment.gateway;

  assert.equal(
    matchesStaleKashierPayment,
    true,
    "the supersede filter must still match a stale Kashier pending payment in the opposite currency"
  );
});
