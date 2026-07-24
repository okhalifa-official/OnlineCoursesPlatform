const test = require("node:test");
const assert = require("node:assert/strict");
const geolocation = require("../services/geolocation");
const { resolveCurrency } = require("./currencyMiddleware");

function makeReq({ ip, headers = {} } = {}) {
  return { ip: ip || "1.2.3.4", header: (name) => headers[name.toLowerCase()] };
}

test("explicit valid override header wins over geolocation", async (t) => {
  const original = geolocation.resolveCountryFromIp;
  geolocation.resolveCountryFromIp = async () => "EG";
  t.after(() => { geolocation.resolveCountryFromIp = original; });

  const req = makeReq({ headers: { "x-currency-preference": "USD" } });
  let nextCalled = false;
  await resolveCurrency(req, {}, () => { nextCalled = true; });

  assert.equal(req.resolvedCurrency, "USD");
  assert.equal(nextCalled, true);
});

test("invalid override header is ignored, falls through to geolocation", async (t) => {
  const original = geolocation.resolveCountryFromIp;
  geolocation.resolveCountryFromIp = async () => "US";
  t.after(() => { geolocation.resolveCountryFromIp = original; });

  const req = makeReq({ headers: { "x-currency-preference": "XYZ" } });
  await resolveCurrency(req, {}, () => {});

  assert.equal(req.resolvedCurrency, "USD");
});

test("Egypt country code resolves to EGP", async (t) => {
  const original = geolocation.resolveCountryFromIp;
  geolocation.resolveCountryFromIp = async () => "EG";
  t.after(() => { geolocation.resolveCountryFromIp = original; });

  const req = makeReq();
  await resolveCurrency(req, {}, () => {});

  assert.equal(req.resolvedCurrency, "EGP");
});

test("any non-Egypt country code resolves to USD", async (t) => {
  const original = geolocation.resolveCountryFromIp;
  geolocation.resolveCountryFromIp = async () => "US";
  t.after(() => { geolocation.resolveCountryFromIp = original; });

  const req = makeReq();
  await resolveCurrency(req, {}, () => {});

  assert.equal(req.resolvedCurrency, "USD");
});

test("null/unresolvable country code defaults to EGP", async (t) => {
  const original = geolocation.resolveCountryFromIp;
  geolocation.resolveCountryFromIp = async () => null;
  t.after(() => { geolocation.resolveCountryFromIp = original; });

  const req = makeReq();
  await resolveCurrency(req, {}, () => {});

  assert.equal(req.resolvedCurrency, "EGP");
});

test("calls next() exactly once even when geolocation rejects", async (t) => {
  const original = geolocation.resolveCountryFromIp;
  geolocation.resolveCountryFromIp = async () => { throw new Error("boom"); };
  t.after(() => { geolocation.resolveCountryFromIp = original; });

  const req = makeReq();
  let nextCallCount = 0;
  await resolveCurrency(req, {}, () => { nextCallCount += 1; });

  assert.equal(nextCallCount, 1);
  assert.equal(req.resolvedCurrency, "EGP");
});
