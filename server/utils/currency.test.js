const test = require("node:test");
const assert = require("node:assert/strict");
const { convertPrice } = require("./currency");

test("EGP passthrough returns the amount unchanged", () => {
  assert.deepEqual(convertPrice(400, "EGP", 51.35), { amount: 400, currency: "EGP" });
});

test("free course (0) stays 0 in both currencies", () => {
  assert.deepEqual(convertPrice(0, "USD", 51.35), { amount: 0, currency: "USD" });
  assert.deepEqual(convertPrice(0, "EGP", 51.35), { amount: 0, currency: "EGP" });
});

test("400 EGP at 51.35 EGP/USD rounds up to $10", () => {
  // 400 / 51.35 = 7.79... -> ceil to nearest 5 -> 10
  assert.deepEqual(convertPrice(400, "USD", 51.35), { amount: 10, currency: "USD" });
});

test("value exactly on a multiple of 5 is not bumped up further", () => {
  // 500 / 50 = 10.0 exactly -> stays 10
  assert.deepEqual(convertPrice(500, "USD", 50), { amount: 10, currency: "USD" });
});

test("value just over a multiple of 5 rounds up to the next multiple", () => {
  // 505 / 50 = 10.1 -> ceil to 15
  assert.deepEqual(convertPrice(505, "USD", 50), { amount: 15, currency: "USD" });
});

test("throws on a non-finite or non-positive exchange rate", () => {
  assert.throws(() => convertPrice(400, "USD", 0));
  assert.throws(() => convertPrice(400, "USD", NaN));
  assert.throws(() => convertPrice(400, "USD", -5));
});
