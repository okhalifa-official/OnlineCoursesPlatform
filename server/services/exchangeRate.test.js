const test = require("node:test");
const assert = require("node:assert/strict");
const { getEgpPerUsd, __resetCacheForTests } = require("./exchangeRate");
const PaymentSettings = require("../Models/PaymentSettings");

test("returns the live rate on a successful fetch", async (t) => {
  const originalFetch = global.fetch;
  global.fetch = async () => ({
    ok: true,
    json: async () => ({ rates: { EGP: 51.35 } }),
  });
  t.after(() => { global.fetch = originalFetch; });

  __resetCacheForTests();
  const rate = await getEgpPerUsd();

  assert.equal(rate, 51.35);
});

test("reuses the cached rate without calling fetch again within the TTL", async (t) => {
  const originalFetch = global.fetch;
  let callCount = 0;
  global.fetch = async () => {
    callCount += 1;
    return { ok: true, json: async () => ({ rates: { EGP: 48 } }) };
  };
  t.after(() => { global.fetch = originalFetch; });

  __resetCacheForTests();
  await getEgpPerUsd();
  await getEgpPerUsd();

  assert.equal(callCount, 1);
});

test("falls back to PaymentSettings.manualExchangeRateFallback when fetch fails and no cache exists", async (t) => {
  const originalFetch = global.fetch;
  const originalFindOne = PaymentSettings.findOne;
  global.fetch = async () => { throw new Error("network down"); };
  PaymentSettings.findOne = () => ({
    select: async () => ({ manualExchangeRateFallback: 47 }),
  });
  t.after(() => {
    global.fetch = originalFetch;
    PaymentSettings.findOne = originalFindOne;
  });

  __resetCacheForTests();
  const rate = await getEgpPerUsd();

  assert.equal(rate, 47);
});

test("falls back to the schema default (50) when no settings document exists either", async (t) => {
  const originalFetch = global.fetch;
  const originalFindOne = PaymentSettings.findOne;
  global.fetch = async () => { throw new Error("network down"); };
  PaymentSettings.findOne = () => ({ select: async () => null });
  t.after(() => {
    global.fetch = originalFetch;
    PaymentSettings.findOne = originalFindOne;
  });

  __resetCacheForTests();
  const rate = await getEgpPerUsd();

  assert.equal(rate, 50);
});
