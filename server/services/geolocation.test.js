const test = require("node:test");
const assert = require("node:assert/strict");
const { resolveCountryFromIp, __clearCacheForTests } = require("./geolocation");

test("private/loopback IPs resolve to null without calling fetch", async (t) => {
  const originalFetch = global.fetch;
  let called = false;
  global.fetch = async () => { called = true; throw new Error("should not be called"); };
  t.after(() => { global.fetch = originalFetch; });

  __clearCacheForTests();
  const result = await resolveCountryFromIp("127.0.0.1");

  assert.equal(result, null);
  assert.equal(called, false);
});

test("resolves a country code from a successful API response", async (t) => {
  const originalFetch = global.fetch;
  global.fetch = async () => ({
    ok: true,
    json: async () => ({ countryCode: "EG", status: "success" }),
  });
  t.after(() => { global.fetch = originalFetch; });

  __clearCacheForTests();
  const result = await resolveCountryFromIp("41.42.43.44");

  assert.equal(result, "EG");
});

test("returns null when the API call fails", async (t) => {
  const originalFetch = global.fetch;
  global.fetch = async () => { throw new Error("network down"); };
  t.after(() => { global.fetch = originalFetch; });

  __clearCacheForTests();
  const result = await resolveCountryFromIp("8.8.8.8");

  assert.equal(result, null);
});

test("returns null when the API call times out", async (t) => {
  const originalFetch = global.fetch;
  global.fetch = (url, options) => new Promise((resolve, reject) => {
    options.signal.addEventListener("abort", () => reject(new Error("aborted")));
  });
  t.after(() => { global.fetch = originalFetch; });

  __clearCacheForTests();
  const result = await resolveCountryFromIp("8.8.8.8");

  assert.equal(result, null);
});

test("caches a resolved country for the same IP", async (t) => {
  const originalFetch = global.fetch;
  let callCount = 0;
  global.fetch = async () => {
    callCount += 1;
    return { ok: true, json: async () => ({ countryCode: "US", status: "success" }) };
  };
  t.after(() => { global.fetch = originalFetch; });

  __clearCacheForTests();
  await resolveCountryFromIp("9.9.9.9");
  await resolveCountryFromIp("9.9.9.9");

  assert.equal(callCount, 1);
});
