const test = require("node:test");
const assert = require("node:assert/strict");
const {
  resolveCountryFromIp,
  __clearCacheForTests,
  __setCacheLimitForTests,
  __getCacheForTests,
} = require("./geolocation");

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

test("evicts the oldest entry once the cache exceeds its configured limit", async (t) => {
  const originalFetch = global.fetch;
  global.fetch = async () => ({
    ok: true,
    json: async () => ({ countryCode: "US", status: "success" }),
  });
  t.after(() => {
    global.fetch = originalFetch;
    __setCacheLimitForTests(undefined); // restore default limit
  });

  __clearCacheForTests();
  __setCacheLimitForTests(3);

  await resolveCountryFromIp("1.1.1.1");
  await resolveCountryFromIp("2.2.2.2");
  await resolveCountryFromIp("3.3.3.3");

  const cacheBeforeEviction = __getCacheForTests();
  assert.equal(cacheBeforeEviction.size, 3);
  assert.ok(cacheBeforeEviction.has("1.1.1.1"));

  // Fourth distinct IP should push the cache past its limit of 3,
  // evicting the oldest entry (1.1.1.1) by insertion order.
  await resolveCountryFromIp("4.4.4.4");

  const cacheAfterEviction = __getCacheForTests();
  assert.equal(cacheAfterEviction.size, 3);
  assert.equal(cacheAfterEviction.has("1.1.1.1"), false);
  assert.ok(cacheAfterEviction.has("2.2.2.2"));
  assert.ok(cacheAfterEviction.has("3.3.3.3"));
  assert.ok(cacheAfterEviction.has("4.4.4.4"));
});
