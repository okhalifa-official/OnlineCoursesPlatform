# Dynamic Currency Pricing (EGP / USD) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace hardcoded `$` pricing everywhere with a currency resolved per-visitor (EGP by default, USD for non-Egypt visitors via IP geolocation), converting course prices with a live EGP→USD rate rounded up to the nearest 5, and making Kashier checkout actually charge in the resolved currency while keeping the EGP-only InstaPay flow hidden for USD checkouts.

**Architecture:** A backend Express middleware (`resolveCurrency`) resolves EGP/USD per request (override header → IP geolocation → EGP default), a cached exchange-rate service supplies the live rate with a DB-backed fallback, and a single shared `convertPrice()` utility is used by both the course-display endpoints and the Kashier checkout-session creation so displayed and charged amounts can never drift apart. The frontend gets one shared currency-formatting utility and a manual EGP/USD toggle; admin-facing pages are explicitly left showing raw EGP.

**Tech Stack:** Node.js (v25, native `fetch` and `node:test`/`node:assert`) + Express 4 + Mongoose 8 on the backend; React 19 + Vite on the frontend. No test framework currently exists in this repo — this plan introduces `node:test` (built into Node, zero new dependency) for backend unit/integration tests. No frontend test framework is introduced; frontend changes are verified manually per the spec.

## Global Constraints

- USD conversion rounds **up** to the next multiple of 5 (`Math.ceil(raw / 5) * 5`); EGP is never rounded.
- Free courses (`coursePrice` 0 or falsy) always display/charge `0` regardless of currency.
- `Payment.currency` and `PaymentTransaction.currency` enums are trimmed to `["USD", "EGP"]` only (EUR/GBP removed).
- Geolocation/exchange-rate failures must never block a request — always fall back to EGP / cached or fallback rate.
- Admin-facing pages (Reports, Payments, Courses list/form, PaymentSettings/Settings) always show raw EGP — no geolocation-based conversion applied there.
- `Course.coursePrice` is never modified by this feature — it remains the canonical EGP number.
- InstaPay is only offered when the resolved currency is `EGP`.
- The checkout amount/currency is always recomputed fresh from `coursePrice` + the current rate at session-creation time — never trusts a client-supplied displayed price.

---

## File Structure

**Backend — new files:**
- `server/middleware/currencyMiddleware.js` — `resolveCurrency` Express middleware (geolocation + override resolution).
- `server/services/geolocation.js` — IP→country lookup with in-memory TTL cache.
- `server/services/exchangeRate.js` — live EGP-per-USD rate fetch with cache + DB fallback.
- `server/utils/currency.js` — `convertPrice()`, the single conversion+rounding function.
- `server/utils/currency.test.js`, `server/services/exchangeRate.test.js`, `server/services/geolocation.test.js`, `server/middleware/currencyMiddleware.test.js` — `node:test` suites.

**Backend — modified files:**
- `server/Models/PaymentSettings.js` — drop `baseCurrency`, add `manualExchangeRateFallback`.
- `server/Models/payment.js` — trim `currency` enum, default to `EGP`.
- `server/Models/PaymentTransaction.js` — trim `currency` enum, default to `EGP`.
- `server/Routers/userAuth.js` — apply `resolveCurrency` to `GET /courses`, `GET /courses/:id`; annotate responses.
- `server/Routers/userPayment.js` — apply `resolveCurrency` to `POST /checkout-session` and `GET /instapay/config`.
- `server/Controllers/kashierPayment.js` — use `resolveCurrency` + `convertPrice()` instead of `getBaseCurrency()`.
- `server/Controllers/instapayPayment.js` — `getInstapayConfig` reports availability based on resolved currency.
- `server/Controllers/Payment.js` — drop `baseCurrency` from settings get/create/update.
- `server/package.json` — add a `test` script.

**Frontend — new files:**
- `client/src/utils/currency.js` — `formatPrice()`, `getCurrencyPreference()`, `setCurrencyPreference()`.
- `client/src/user/components/CurrencyToggle.jsx` — small EGP/USD switcher component.

**Frontend — modified files:**
- `client/src/user/api/userApi.js` — attach `X-Currency-Preference` header in `userApiFetch`.
- `client/src/user/pages/CoursesPage.jsx` — replace hardcoded `$` in `CourseCard`.
- `client/src/user/pages/CourseDetail.jsx` — replace hardcoded `$`, add `<CurrencyToggle>`.
- `client/src/user/pages/Payment.jsx` — replace hardcoded EGP formatter, attach currency header to axios calls, hide InstaPay tab under USD.
- `client/src/user/pages/PaymentHistory.jsx` — fix hardcoded `"EGP"` total-spent stat to group by actual currency.
- `client/src/admin/components/CourseForm.jsx` — relabel price field to "Course Price (EGP)".
- `client/src/admin/pages/PaymentSettings.jsx` — remove Base Currency control, add fallback-rate field.
- `client/src/admin/pages/Settings.jsx` — remove duplicate Base Currency control.
- `client/src/admin/pages/Payments.jsx` — trim manual-transaction currency `<select>` options; keep `$` formatting as-is (EGP-only, admin-facing).

---

### Task 1: `convertPrice()` conversion utility

**Files:**
- Create: `server/utils/currency.js`
- Test: `server/utils/currency.test.js`

**Interfaces:**
- Produces: `convertPrice(egpAmount: number, targetCurrency: "EGP"|"USD", egpPerUsd: number) -> { amount: number, currency: "EGP"|"USD" }`

- [ ] **Step 1: Write the failing tests**

```js
// server/utils/currency.test.js
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd server && node --test utils/currency.test.js`
Expected: FAIL — `Cannot find module './currency'` (file doesn't exist yet).

- [ ] **Step 3: Write minimal implementation**

```js
// server/utils/currency.js
function convertPrice(egpAmount, targetCurrency, egpPerUsd) {
  const amount = Number(egpAmount) || 0;

  if (targetCurrency === "EGP") {
    return { amount, currency: "EGP" };
  }

  if (targetCurrency !== "USD") {
    throw new Error(`Unsupported target currency: ${targetCurrency}`);
  }

  if (amount === 0) {
    return { amount: 0, currency: "USD" };
  }

  if (!Number.isFinite(egpPerUsd) || egpPerUsd <= 0) {
    throw new Error("egpPerUsd must be a positive finite number");
  }

  const rawUsd = amount / egpPerUsd;
  const roundedUp = Math.ceil(rawUsd / 5) * 5;

  return { amount: roundedUp, currency: "USD" };
}

module.exports = { convertPrice };
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd server && node --test utils/currency.test.js`
Expected: PASS — all 6 tests green.

- [ ] **Step 5: Commit**

```bash
git add server/utils/currency.js server/utils/currency.test.js
git commit -m "feat: add convertPrice currency conversion utility"
```

---

### Task 2: Server test script

**Files:**
- Modify: `server/package.json`

**Interfaces:**
- Consumes: nothing new (Node's built-in `node:test` runner).
- Produces: `npm test` runs all `*.test.js` files under `server/`.

- [ ] **Step 1: Add the test script**

In `server/package.json`, update `"scripts"`:

```json
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "test": "node --test"
  },
```

- [ ] **Step 2: Run it to confirm it picks up Task 1's suite**

Run: `cd server && npm test`
Expected: PASS — reports the 6 tests from `utils/currency.test.js`.

- [ ] **Step 3: Commit**

```bash
git add server/package.json
git commit -m "chore: add node --test script to server package.json"
```

---

### Task 3: Geolocation service

**Files:**
- Create: `server/services/geolocation.js`
- Test: `server/services/geolocation.test.js`

**Interfaces:**
- Consumes: global `fetch` (Node 18+ built-in).
- Produces: `resolveCountryFromIp(ip: string) -> Promise<string | null>` — returns an ISO-3166 alpha-2 country code (e.g. `"EG"`, `"US"`) or `null` if the IP is private/unresolvable/the lookup failed. Also exports `__clearCacheForTests()` for test isolation.

- [ ] **Step 1: Write the failing tests**

```js
// server/services/geolocation.test.js
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd server && node --test services/geolocation.test.js`
Expected: FAIL — `Cannot find module './geolocation'`.

- [ ] **Step 3: Write minimal implementation**

```js
// server/services/geolocation.js
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const REQUEST_TIMEOUT_MS = 1500;

let cache = new Map(); // ip -> { countryCode, expiresAt }

function isPrivateOrLoopbackIp(ip) {
  if (!ip) return true;

  const normalized = String(ip).replace("::ffff:", "");

  return (
    normalized === "127.0.0.1" ||
    normalized === "::1" ||
    normalized.startsWith("10.") ||
    normalized.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(normalized)
  );
}

async function resolveCountryFromIp(ip) {
  if (isPrivateOrLoopbackIp(ip)) {
    return null;
  }

  const cached = cache.get(ip);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.countryCode;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,countryCode`,
      { signal: controller.signal }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const countryCode = data?.status === "success" ? data.countryCode || null : null;

    cache.set(ip, { countryCode, expiresAt: Date.now() + CACHE_TTL_MS });

    return countryCode;
  } catch (error) {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

function __clearCacheForTests() {
  cache = new Map();
}

module.exports = { resolveCountryFromIp, __clearCacheForTests };
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd server && node --test services/geolocation.test.js`
Expected: PASS — all 5 tests green.

- [ ] **Step 5: Commit**

```bash
git add server/services/geolocation.js server/services/geolocation.test.js
git commit -m "feat: add IP geolocation service with caching and timeout"
```

---

### Task 4: PaymentSettings model — swap `baseCurrency` for `manualExchangeRateFallback`

**Files:**
- Modify: `server/Models/PaymentSettings.js`

**Interfaces:**
- Produces: `PaymentSettings.manualExchangeRateFallback: number` (EGP per 1 USD, default `50`), replacing the removed `baseCurrency` field.

- [ ] **Step 1: Edit the schema**

In `server/Models/PaymentSettings.js`, replace:

```js
    baseCurrency: {
      type: String,
      enum: ["USD", "EUR", "GBP", "EGP"],
      default: "USD",
    },
```

with:

```js
    manualExchangeRateFallback: {
      type: Number,
      default: 50,
      min: 1,
    },
```

- [ ] **Step 2: Verify no syntax errors**

Run: `cd server && node -e "require('./Models/PaymentSettings.js'); console.log('OK')"`
Expected: prints `OK` (requires `DB` env var to not be hit since this only loads the schema, not a connection — if it throws on a missing `mongoose` connection, run instead: `node -e "require('mongoose'); const s = require('./Models/PaymentSettings.js'); console.log(Object.keys(s.schema.paths))"` and confirm `manualExchangeRateFallback` is listed and `baseCurrency` is not).

- [ ] **Step 3: Commit**

```bash
git add server/Models/PaymentSettings.js
git commit -m "refactor: replace PaymentSettings.baseCurrency with manualExchangeRateFallback"
```

---

### Task 5: Exchange rate service

**Files:**
- Create: `server/services/exchangeRate.js`
- Test: `server/services/exchangeRate.test.js`

**Interfaces:**
- Consumes: `PaymentSettings` model (`server/Models/PaymentSettings.js`) for `manualExchangeRateFallback`; global `fetch`.
- Produces: `getEgpPerUsd() -> Promise<number>`; `__resetCacheForTests()` for test isolation.

- [ ] **Step 1: Write the failing tests**

```js
// server/services/exchangeRate.test.js
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd server && node --test services/exchangeRate.test.js`
Expected: FAIL — `Cannot find module './exchangeRate'`.

- [ ] **Step 3: Write minimal implementation**

```js
// server/services/exchangeRate.js
const PaymentSettings = require("../Models/PaymentSettings");

const CACHE_TTL_MS = 8 * 60 * 60 * 1000; // 8h
const REQUEST_TIMEOUT_MS = 3000;
const DEFAULT_FALLBACK_RATE = 50;

let cachedRate = null;
let cacheExpiresAt = 0;

async function fetchLiveRate() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch("https://open.er-api.com/v6/latest/USD", {
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const rate = data?.rates?.EGP;

    return Number.isFinite(rate) && rate > 0 ? rate : null;
  } catch (error) {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function getFallbackRate() {
  const settings = await PaymentSettings.findOne().select("manualExchangeRateFallback");
  const fallback = settings?.manualExchangeRateFallback;

  return Number.isFinite(fallback) && fallback > 0 ? fallback : DEFAULT_FALLBACK_RATE;
}

async function getEgpPerUsd() {
  if (cachedRate && cacheExpiresAt > Date.now()) {
    return cachedRate;
  }

  const liveRate = await fetchLiveRate();

  if (liveRate) {
    cachedRate = liveRate;
    cacheExpiresAt = Date.now() + CACHE_TTL_MS;
    return cachedRate;
  }

  if (cachedRate) {
    // Stale cache is still better than nothing.
    return cachedRate;
  }

  return getFallbackRate();
}

function __resetCacheForTests() {
  cachedRate = null;
  cacheExpiresAt = 0;
}

module.exports = { getEgpPerUsd, __resetCacheForTests };
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd server && node --test services/exchangeRate.test.js`
Expected: PASS — all 4 tests green.

- [ ] **Step 5: Commit**

```bash
git add server/services/exchangeRate.js server/services/exchangeRate.test.js
git commit -m "feat: add exchange rate service with cache and PaymentSettings fallback"
```

---

### Task 6: `resolveCurrency` middleware

**Files:**
- Create: `server/middleware/currencyMiddleware.js`
- Test: `server/middleware/currencyMiddleware.test.js`

**Interfaces:**
- Consumes: `resolveCountryFromIp` from `server/services/geolocation.js` (Task 3).
- Produces: Express middleware `resolveCurrency(req, res, next)` that sets `req.resolvedCurrency` to `"EGP"` or `"USD"`.

- [ ] **Step 1: Write the failing tests**

```js
// server/middleware/currencyMiddleware.test.js
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd server && node --test middleware/currencyMiddleware.test.js`
Expected: FAIL — `Cannot find module './currencyMiddleware'`.

- [ ] **Step 3: Write minimal implementation**

```js
// server/middleware/currencyMiddleware.js
const { resolveCountryFromIp } = require("../services/geolocation");

const VALID_CURRENCIES = new Set(["EGP", "USD"]);
const EGYPT_COUNTRY_CODE = "EG";

async function resolveCurrency(req, res, next) {
  try {
    const overrideHeader = String(req.header("x-currency-preference") || "")
      .trim()
      .toUpperCase();

    if (VALID_CURRENCIES.has(overrideHeader)) {
      req.resolvedCurrency = overrideHeader;
      return next();
    }

    const countryCode = await resolveCountryFromIp(req.ip);
    req.resolvedCurrency = countryCode && countryCode !== EGYPT_COUNTRY_CODE ? "USD" : "EGP";

    return next();
  } catch (error) {
    req.resolvedCurrency = "EGP";
    return next();
  }
}

module.exports = { resolveCurrency };
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd server && node --test middleware/currencyMiddleware.test.js`
Expected: PASS — all 6 tests green.

- [ ] **Step 5: Commit**

```bash
git add server/middleware/currencyMiddleware.js server/middleware/currencyMiddleware.test.js
git commit -m "feat: add resolveCurrency middleware (override header + IP geolocation)"
```

---

### Task 7: Wire currency resolution into the course endpoints

**Files:**
- Modify: `server/Routers/userAuth.js:19-38`

**Interfaces:**
- Consumes: `resolveCurrency` from `server/middleware/currencyMiddleware.js` (Task 6), `convertPrice` from `server/utils/currency.js` (Task 1), `getEgpPerUsd` from `server/services/exchangeRate.js` (Task 5).
- Produces: `GET /api/user/courses` and `GET /api/user/courses/:id` responses now include `displayPrice: number` and `currency: "EGP"|"USD"` alongside the existing `coursePrice` field.

- [ ] **Step 1: Edit the router**

In `server/Routers/userAuth.js`, add the import near the top (after existing requires, e.g. after line 9):

```js
const { resolveCurrency } = require("../middleware/currencyMiddleware");
const { convertPrice } = require("../utils/currency");
const { getEgpPerUsd } = require("../services/exchangeRate");
```

Replace lines 18-38 (the two course routes) with:

```js
// Courses — browse published courses
router.get("/courses", resolveCurrency, async (req, res) => {
  try {
    const courses = await Course.find({ publishStatus: "Published" }).sort({
      createdAt: -1,
    });
    const egpPerUsd = await getEgpPerUsd();
    const annotated = courses.map((course) => {
      const { amount, currency } = convertPrice(course.coursePrice, req.resolvedCurrency, egpPerUsd);
      return { ...course.toObject(), displayPrice: amount, currency };
    });
    res.json(annotated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/courses/:id", resolveCurrency, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });
    const egpPerUsd = await getEgpPerUsd();
    const { amount, currency } = convertPrice(course.coursePrice, req.resolvedCurrency, egpPerUsd);
    res.json({ ...course.toObject(), displayPrice: amount, currency });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
```

- [ ] **Step 2: Manual verification (no DB-backed automated test for this router — it's a thin composition of already-tested units)**

Run: `cd server && npm run dev` (in one terminal), then in another:
```bash
curl -s http://localhost:4000/api/user/courses | head -c 500
```
Expected: JSON array where each course object includes `"displayPrice"` and `"currency": "EGP"` (dev machine's IP resolves to `null` → EGP default).

Then:
```bash
curl -s -H "X-Currency-Preference: USD" http://localhost:4000/api/user/courses | head -c 500
```
Expected: same array, now `"currency": "USD"` and `displayPrice` values rounded up to multiples of 5.

- [ ] **Step 3: Commit**

```bash
git add server/Routers/userAuth.js
git commit -m "feat: annotate course list/detail endpoints with resolved currency and display price"
```

---

### Task 8: Payment/PaymentTransaction currency enum cleanup

**Files:**
- Modify: `server/Models/payment.js:51-55`
- Modify: `server/Models/PaymentTransaction.js:66-70`

**Interfaces:**
- Produces: `Payment.currency` and `PaymentTransaction.currency` both `enum: ["USD", "EGP"], default: "EGP"`.

- [ ] **Step 1: Edit `payment.js`**

Replace lines 51-55:

```js
    currency: {
      type: String,
      enum: ["USD", "EUR", "GBP", "EGP"],
      default: "EGP",
    },
```

with:

```js
    currency: {
      type: String,
      enum: ["USD", "EGP"],
      default: "EGP",
    },
```

(This is already `default: "EGP"` — only the enum shrinks.)

- [ ] **Step 2: Edit `PaymentTransaction.js`**

Replace lines 66-70:

```js
    currency: {
      type: String,
      enum: ["USD", "EUR", "GBP", "EGP"],
      default: "USD",
    },
```

with:

```js
    currency: {
      type: String,
      enum: ["USD", "EGP"],
      default: "EGP",
    },
```

- [ ] **Step 3: Verify no syntax errors**

Run: `cd server && node -e "require('./Models/payment.js'); require('./Models/PaymentTransaction.js'); console.log('OK')"`
Expected: prints `OK`.

- [ ] **Step 4: Commit**

```bash
git add server/Models/payment.js server/Models/PaymentTransaction.js
git commit -m "refactor: trim Payment/PaymentTransaction currency enum to USD/EGP"
```

---

### Task 9: PaymentSettings controller — drop `baseCurrency`

**Files:**
- Modify: `server/Controllers/Payment.js:49-62,439-465`

**Interfaces:**
- Consumes: `PaymentSettings.manualExchangeRateFallback` (Task 4).
- Produces: `getPaymentSettings`/`updatePaymentSettings` no longer read/write `baseCurrency`; `updatePaymentSettings` accepts `manualExchangeRateFallback`.

- [ ] **Step 1: Edit `getOrCreatePaymentSettings`**

Replace lines 49-62:

```js
async function getOrCreatePaymentSettings() {
  let settings = await PaymentSettings.findOne();

  if (!settings) {
    settings = await PaymentSettings.create({
      visaMastercard: true,
      digitalWallet: true,
      cashOffline: false,
      baseCurrency: "USD",
    });
  }

  return settings;
}
```

with:

```js
async function getOrCreatePaymentSettings() {
  let settings = await PaymentSettings.findOne();

  if (!settings) {
    settings = await PaymentSettings.create({
      visaMastercard: true,
      digitalWallet: true,
      cashOffline: false,
    });
  }

  return settings;
}
```

(`manualExchangeRateFallback` already has a schema default of `50`, so it doesn't need to be listed explicitly here.)

- [ ] **Step 2: Edit `updatePaymentSettings`**

Replace lines 439-465's `findByIdAndUpdate` call body:

```js
      currentSettings._id,
      {
        visaMastercard: Boolean(req.body.visaMastercard),
        digitalWallet: Boolean(req.body.digitalWallet),
        cashOffline: Boolean(req.body.cashOffline),
        baseCurrency: req.body.baseCurrency || currentSettings.baseCurrency,
        updatedBy: req.user?._id,
      },
```

with:

```js
      currentSettings._id,
      {
        visaMastercard: Boolean(req.body.visaMastercard),
        digitalWallet: Boolean(req.body.digitalWallet),
        cashOffline: Boolean(req.body.cashOffline),
        manualExchangeRateFallback:
          Number(req.body.manualExchangeRateFallback) ||
          currentSettings.manualExchangeRateFallback,
        updatedBy: req.user?._id,
      },
```

- [ ] **Step 3: Verify no syntax errors**

Run: `cd server && node -e "require('./Controllers/Payment.js'); console.log('OK')"`
Expected: prints `OK`.

- [ ] **Step 4: Commit**

```bash
git add server/Controllers/Payment.js
git commit -m "refactor: PaymentSettings controller drops baseCurrency, accepts manualExchangeRateFallback"
```

---

### Task 10: Kashier checkout — charge the resolved currency

**Files:**
- Modify: `server/Controllers/kashierPayment.js:116-120,428-518`

**Interfaces:**
- Consumes: `resolveCurrency` middleware attaches `req.resolvedCurrency` (Task 6); `convertPrice` (Task 1); `getEgpPerUsd` (Task 5).
- Produces: `createCheckoutSession` creates `Payment` records with `amount`/`currency` from `convertPrice`, not from the removed `getBaseCurrency()`.

- [ ] **Step 1: Remove `getBaseCurrency` and add new imports**

At the top of `server/Controllers/kashierPayment.js`, add:

```js
const { convertPrice } = require("../utils/currency")
const { getEgpPerUsd } = require("../services/exchangeRate")
```

Delete the `getBaseCurrency` function (lines 116-120):

```js
async function getBaseCurrency() {
  const settings = await PaymentSettings.findOne().select("baseCurrency")

  return settings?.baseCurrency || "EGP"
}
```

- [ ] **Step 2: Update `createCheckoutSession` to use the resolved currency**

Replace this block (around line 438-446):

```js
    const [course, existingEnrollment, currency] = await Promise.all([
      Course.findById(courseId).select("courseName coursePrice publishStatus"),
      Enrollment.findOne({
        courseId,
        userId: req.user._id,
        status: { $in: ["active", "completed"] },
      }),
      getBaseCurrency(),
    ])
```

with:

```js
    const [course, existingEnrollment, egpPerUsd] = await Promise.all([
      Course.findById(courseId).select("courseName coursePrice publishStatus"),
      Enrollment.findOne({
        courseId,
        userId: req.user._id,
        status: { $in: ["active", "completed"] },
      }),
      getEgpPerUsd(),
    ])
```

Replace this line (around line 466):

```js
    const courseAmount = normalizeAmount(course.coursePrice)
```

with:

```js
    const { amount: courseAmount, currency } = convertPrice(
      normalizeAmount(course.coursePrice),
      req.resolvedCurrency,
      egpPerUsd
    )
```

(The `currency` variable name now comes from `convertPrice`'s return, replacing the old `getBaseCurrency()`-sourced `currency` — every downstream usage of `currency` in this function, e.g. `Payment.create({ amount: courseAmount, currency, ... })` at line ~514, stays correct unchanged since the variable name is the same.)

- [ ] **Step 3: Apply `resolveCurrency` middleware on the route**

In `server/Routers/userPayment.js`, add the import:

```js
const { resolveCurrency } = require("../middleware/currencyMiddleware")
```

Change line 20 from:

```js
router.post("/checkout-session", createCheckoutSession)
```

to:

```js
router.post("/checkout-session", resolveCurrency, createCheckoutSession)
```

- [ ] **Step 4: Verify no syntax errors**

Run: `cd server && node -e "require('./Controllers/kashierPayment.js'); require('./Routers/userPayment.js'); console.log('OK')"`
Expected: prints `OK`.

- [ ] **Step 5: Manual verification**

Run: `cd server && npm run dev`, then with a valid student JWT:
```bash
curl -s -X POST http://localhost:4000/api/user/payments/checkout-session \
  -H "Authorization: Bearer <token>" \
  -H "X-Currency-Preference: USD" \
  -H "Content-Type: application/json" \
  -d '{"courseId":"<a real published paid course id>"}'
```
Expected: response `currency` is `"USD"` and `amount` matches `convertPrice`'s rounding (verify against `server/utils/currency.js` output for the same `coursePrice`).

- [ ] **Step 6: Commit**

```bash
git add server/Controllers/kashierPayment.js server/Routers/userPayment.js
git commit -m "feat: Kashier checkout charges the resolved currency via convertPrice"
```

---

### Task 11: Hide InstaPay for USD checkouts

**Files:**
- Modify: `server/Controllers/instapayPayment.js`
- Modify: `server/Routers/userPayment.js:16`

**Interfaces:**
- Consumes: `resolveCurrency` middleware (Task 6).
- Produces: `GET /api/user/payments/instapay/config` response gains `available: boolean` (false when resolved currency is USD); existing fields (`handle`, `currency`, etc.) unchanged when available.

- [ ] **Step 1: Apply the middleware to the InstaPay config route**

In `server/Routers/userPayment.js`, change line 16 from:

```js
router.get("/instapay/config", getInstapayConfig)
```

to:

```js
router.get("/instapay/config", resolveCurrency, getInstapayConfig)
```

(Reuses the `resolveCurrency` import already added in Task 10 Step 3 for this same file.)

- [ ] **Step 2: Update `getInstapayConfig` to report availability**

Find `getInstapayConfig` in `server/Controllers/instapayPayment.js`. Locate its response object (it currently returns something like `{ handle: MERCHANT_HANDLE, currency: DEFAULT_CURRENCY, ... }` — read the function body to find the exact `res.json(...)` call). Add `available: req.resolvedCurrency !== "USD"` to that response object, e.g.:

```js
    return res.status(200).json({
      handle: MERCHANT_HANDLE,
      currency: DEFAULT_CURRENCY,
      available: req.resolvedCurrency !== "USD",
      // ...(keep every other existing field in the response unchanged)
    });
```

- [ ] **Step 3: Verify no syntax errors**

Run: `cd server && node -e "require('./Controllers/instapayPayment.js'); require('./Routers/userPayment.js'); console.log('OK')"`
Expected: prints `OK`.

- [ ] **Step 4: Manual verification**

```bash
curl -s http://localhost:4000/api/user/payments/instapay/config
curl -s -H "X-Currency-Preference: USD" http://localhost:4000/api/user/payments/instapay/config
```
Expected: first call has `"available":true`, second has `"available":false`.

- [ ] **Step 5: Commit**

```bash
git add server/Controllers/instapayPayment.js server/Routers/userPayment.js
git commit -m "feat: InstaPay config reports unavailable when resolved currency is USD"
```

---

### Task 12: Frontend currency utility

**Files:**
- Create: `client/src/utils/currency.js`

**Interfaces:**
- Produces:
  - `formatPrice(amount: number, currency: "EGP"|"USD") -> string`
  - `getCurrencyPreference() -> "EGP"|"USD"|null` (reads `localStorage`, `null` means "auto/geolocation")
  - `setCurrencyPreference(currency: "EGP"|"USD"|null) -> void`

- [ ] **Step 1: Write the utility**

```js
// client/src/utils/currency.js
const STORAGE_KEY = "currencyPreference";
const VALID_CURRENCIES = ["EGP", "USD"];

export function formatPrice(amount, currency) {
  const safeCurrency = VALID_CURRENCIES.includes(currency) ? currency : "EGP";

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: safeCurrency,
      maximumFractionDigits: safeCurrency === "USD" ? 0 : 2,
    }).format(Number(amount || 0));
  } catch {
    return `${Number(amount || 0).toFixed(2)} ${safeCurrency}`;
  }
}

export function getCurrencyPreference() {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage?.getItem(STORAGE_KEY);
  return VALID_CURRENCIES.includes(stored) ? stored : null;
}

export function setCurrencyPreference(currency) {
  if (typeof window === "undefined") return;
  if (currency === null) {
    window.localStorage?.removeItem(STORAGE_KEY);
    return;
  }
  if (VALID_CURRENCIES.includes(currency)) {
    window.localStorage?.setItem(STORAGE_KEY, currency);
  }
}
```

- [ ] **Step 2: Manual verification in the browser console**

Run: `cd client && npm run dev`, open the dev server in a browser, open devtools console, paste:
```js
import("/src/utils/currency.js").then((m) => {
  console.log(m.formatPrice(10, "USD")); // expect "$10"
  console.log(m.formatPrice(400, "EGP")); // expect "EGP 400.00" or similar locale format
  console.log(m.getCurrencyPreference()); // expect null initially
  m.setCurrencyPreference("USD");
  console.log(m.getCurrencyPreference()); // expect "USD"
});
```
Expected: outputs match the comments.

- [ ] **Step 3: Commit**

```bash
git add client/src/utils/currency.js
git commit -m "feat: add shared frontend currency formatting utility"
```

---

### Task 13: Attach currency preference header to API calls

**Files:**
- Modify: `client/src/user/api/userApi.js:60-74`

**Interfaces:**
- Consumes: `getCurrencyPreference` from `client/src/utils/currency.js` (Task 12).
- Produces: every `userApiFetch` call now sends `X-Currency-Preference` when a preference is set in `localStorage`.

- [ ] **Step 1: Import the helper**

At the top of `client/src/user/api/userApi.js`, add:

```js
import { getCurrencyPreference } from "../../utils/currency";
```

- [ ] **Step 2: Add the header in `userApiFetch`**

Replace lines 60-68:

```js
export async function userApiFetch(path, options = {}) {
  const token = getUserToken();

  const headers = { ...(options.headers || {}) };

  // Don't set Content-Type for FormData — browser must set it with the boundary.
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
```

with:

```js
export async function userApiFetch(path, options = {}) {
  const token = getUserToken();

  const headers = { ...(options.headers || {}) };

  // Don't set Content-Type for FormData — browser must set it with the boundary.
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const currencyPreference = getCurrencyPreference();
  if (currencyPreference) {
    headers["X-Currency-Preference"] = currencyPreference;
  }
```

- [ ] **Step 3: Manual verification**

Run: `cd client && npm run dev`, open the Courses page in a browser with devtools Network tab open, confirm `GET /api/user/courses` has no `X-Currency-Preference` header by default. Then in the console run `localStorage.setItem("currencyPreference", "USD")`, reload, confirm the header is now present with value `USD`.

- [ ] **Step 4: Commit**

```bash
git add client/src/user/api/userApi.js
git commit -m "feat: send X-Currency-Preference header from userApiFetch"
```

---

### Task 14: Currency toggle component

**Files:**
- Create: `client/src/user/components/CurrencyToggle.jsx`

**Interfaces:**
- Consumes: `getCurrencyPreference`, `setCurrencyPreference` from `client/src/utils/currency.js` (Task 12).
- Produces: `<CurrencyToggle onChange={() => void} />` — a two-button EGP/USD switcher. Calling `onChange` after a switch lets the parent page re-fetch data with the new header.

- [ ] **Step 1: Write the component**

```jsx
// client/src/user/components/CurrencyToggle.jsx
import { useState } from "react";
import { getCurrencyPreference, setCurrencyPreference } from "../../utils/currency";

export default function CurrencyToggle({ onChange }) {
  const [preference, setPreference] = useState(() => getCurrencyPreference() || "EGP");

  function handleSelect(currency) {
    if (currency === preference) return;
    setCurrencyPreference(currency);
    setPreference(currency);
    onChange?.(currency);
  }

  return (
    <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden text-xs font-bold">
      {["EGP", "USD"].map((currency) => (
        <button
          key={currency}
          type="button"
          onClick={() => handleSelect(currency)}
          className={`px-3 py-1.5 transition ${
            preference === currency
              ? "bg-charcoal text-white"
              : "bg-white text-charcoal hover:bg-softGrey"
          }`}
        >
          {currency}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Manual verification**

Deferred to Task 15 (used inline on `CourseDetail.jsx`) — no standalone render target exists yet.

- [ ] **Step 3: Commit**

```bash
git add client/src/user/components/CurrencyToggle.jsx
git commit -m "feat: add CurrencyToggle EGP/USD switcher component"
```

---

### Task 15: Replace hardcoded `$` on student-facing pages

**Files:**
- Modify: `client/src/user/pages/CoursesPage.jsx:247-248`
- Modify: `client/src/user/pages/CourseDetail.jsx:139,347-349`

**Interfaces:**
- Consumes: `formatPrice` from `client/src/utils/currency.js` (Task 12); `CurrencyToggle` from Task 14; `course.displayPrice`/`course.currency` now present on API responses (Task 7).

- [ ] **Step 1: Update `CoursesPage.jsx`**

Add the import near the top (after existing imports, e.g. after line 6):

```js
import { formatPrice } from "../../utils/currency";
```

Replace lines 247-248:

```jsx
          <span className={`font-bold text-base ${!course.coursePrice || Number(course.coursePrice) === 0 ? "text-emerald-600" : "text-brandRed"}`}>
            {!course.coursePrice || Number(course.coursePrice) === 0 ? "Free" : `$${course.coursePrice}`}
          </span>
```

with:

```jsx
          <span className={`font-bold text-base ${!course.coursePrice || Number(course.coursePrice) === 0 ? "text-emerald-600" : "text-brandRed"}`}>
            {!course.coursePrice || Number(course.coursePrice) === 0
              ? "Free"
              : formatPrice(course.displayPrice, course.currency)}
          </span>
```

- [ ] **Step 2: Update `CourseDetail.jsx`**

Add the import near the top (after line 11):

```js
import { formatPrice } from "../../utils/currency";
import CurrencyToggle from "../components/CurrencyToggle";
```

Replace line 348 (inside the pricing card):

```jsx
                  {isFree ? "Free" : `$${course.coursePrice}`}
```

with:

```jsx
                  {isFree ? "Free" : formatPrice(course.displayPrice, course.currency)}
```

Add a `<CurrencyToggle>` just above the price paragraph (before line 347, inside the `<div className="p-6">` block starting at line 346), and reload the course on change:

```jsx
                {!isFree && (
                  <div className="mb-3">
                    <CurrencyToggle onChange={() => window.location.reload()} />
                  </div>
                )}
```

- [ ] **Step 3: Manual verification in the browser**

Run: `cd client && npm run dev` and `cd server && npm run dev` together. Open `/courses`, confirm prices show "Free" or a formatted EGP amount (no `$`). Open a paid course's detail page, confirm the toggle appears, click USD, confirm the page reloads and the price now shows a `$`-formatted, nearest-5-rounded amount, and the "Enroll Now"/"Buy Now" button still works.

- [ ] **Step 4: Commit**

```bash
git add client/src/user/pages/CoursesPage.jsx client/src/user/pages/CourseDetail.jsx
git commit -m "feat: replace hardcoded dollar pricing with resolved-currency display on student pages"
```

---

### Task 16: Checkout page — currency-aware formatting and InstaPay visibility

**Files:**
- Modify: `client/src/user/pages/Payment.jsx:30-36,56-97,147-196`

**Interfaces:**
- Consumes: `formatPrice` (Task 12); `getCurrencyPreference` (Task 12); course/instapayConfig responses now carry `currency`/`displayPrice`/`available` fields (Tasks 7, 11).

- [ ] **Step 1: Replace the hardcoded EGP formatter**

Add the import near the top (after line 4):

```js
import { formatPrice, getCurrencyPreference } from "../../utils/currency";
```

Delete the local `formatCurrency` function (lines 30-36):

```js
function formatCurrency(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));
}
```

Find every call site of `formatCurrency(...)` elsewhere in this file (search for `formatCurrency(`) and replace each with `formatPrice(course.displayPrice, course.currency)` (using whatever the local variable for the course/amount is at that call site — inspect the surrounding JSX to match the existing variable name).

- [ ] **Step 2: Send the currency header on the raw axios calls**

This file uses `axios` directly rather than `userApiFetch`, so Task 13's header isn't applied here automatically. Update the three `axios` calls (course load at line 75, instapay config at line 91, checkout session at line 186) to include the header. For example, the course load `useEffect` (lines 64-85):

```js
  useEffect(() => {
    let ignore = false;
    async function loadCourse() {
      if (!query.courseId) {
        setCourseLoading(false);
        setError("A courseId query parameter is required to open checkout.");
        return;
      }
      setCourseLoading(true);
      setError("");
      try {
        const currencyPreference = getCurrencyPreference();
        const response = await axios.get(`${API_BASE}/user/courses/${query.courseId}`, {
          headers: currencyPreference ? { "X-Currency-Preference": currencyPreference } : {},
        });
        if (!ignore) setCourse(response.data);
      } catch (err) {
        if (!ignore) setError(err.response?.data?.message || "Failed to load the selected course.");
      } finally {
        if (!ignore) setCourseLoading(false);
      }
    }
    loadCourse();
    return () => { ignore = true; };
  }, [query.courseId]);
```

Apply the same `headers: currencyPreference ? { "X-Currency-Preference": currencyPreference } : {}` pattern to the `instapay/config` GET (lines 87-97) and the `checkout-session` POST (lines 179-196, merged with the existing `Authorization` header):

```js
      const currencyPreference = getCurrencyPreference();
      const response = await axios.post(
        `${API_BASE}/user/payments/checkout-session`,
        { courseId: query.courseId },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            ...(currencyPreference ? { "X-Currency-Preference": currencyPreference } : {}),
          },
        }
      );
```

- [ ] **Step 3: Hide the InstaPay tab when unavailable**

Locate the tab-button JSX around line 399 (`onClick={() => setActiveTab("instapay")}`, inside the `FormBlock` component that receives `instapayConfig` as a prop). Wrap that button in a condition on `instapayConfig?.available`:

```jsx
          {instapayConfig?.available !== false && (
            <button
              type="button"
              onClick={() => setActiveTab("instapay")}
              className={/* existing className expression, unchanged */}
            >
              InstaPay
            </button>
          )}
```

Also add a `useEffect` in the main `PaymentPage` component (near the existing `activeTab` state at line 56) that forces `activeTab` to `"card"` if InstaPay becomes unavailable after config loads:

```js
  useEffect(() => {
    if (instapayConfig?.available === false && activeTab === "instapay") {
      setActiveTab("card");
    }
  }, [instapayConfig, activeTab]);
```

- [ ] **Step 4: Manual verification**

Run both dev servers. Open `/payment?courseId=<paid course id>` with no currency preference set — confirm both tabs show and prices are EGP-formatted. In the browser console run `localStorage.setItem("currencyPreference", "USD")` and reload — confirm the InstaPay tab is gone, only "Card" shows, and the price is `$`-formatted.

- [ ] **Step 5: Commit**

```bash
git add client/src/user/pages/Payment.jsx
git commit -m "feat: checkout page uses resolved currency formatting and hides InstaPay for USD"
```

---

### Task 17: Fix PaymentHistory's mis-currencied total

**Files:**
- Modify: `client/src/user/pages/PaymentHistory.jsx:20-30,103-114,136-141`

**Interfaces:**
- Consumes: `formatPrice` from `client/src/utils/currency.js` (Task 12), replacing the local `formatCurrency`.

- [ ] **Step 1: Replace the local formatter with the shared one**

Add the import near the top (after line 3):

```js
import { formatPrice } from "../../utils/currency";
```

Delete the local `formatCurrency` function (lines 20-30) — `formatPrice` from Task 12 is a drop-in replacement with the same `(amount, currency)` signature.

- [ ] **Step 2: Group the "Total spent" stat by currency instead of assuming EGP**

Replace the `stats` computation (lines 103-114ish — locate the `useMemo` block) so `spent` becomes a per-currency map instead of a single number:

```js
  const stats = useMemo(() => {
    let total = 0, pending = 0, approved = 0;
    const spentByCurrency = {};

    items.forEach((p) => {
      total += 1;
      if (["auto_approved", "approved", "confirmed"].includes(p.status)) approved += 1;
      if (["under_review", "pending"].includes(p.status)) pending += 1;
      if (["auto_approved", "approved", "confirmed"].includes(p.status)) {
        const currency = p.currency || "EGP";
        spentByCurrency[currency] = (spentByCurrency[currency] || 0) + Number(p.amount || 0);
      }
    });

    return { total, spentByCurrency, pending, approved };
  }, [items]);
```

(Keep whatever the existing status-matching conditions are for `approved`/`pending`/the original `spent +=` line — read the current block first and preserve its exact status-list logic, only changing the `spent` accumulator into `spentByCurrency`.)

- [ ] **Step 3: Update the stat card to render one line per currency present**

Replace line 140:

```jsx
          <StatCard label="Total spent"      value={formatCurrency(stats.spent, "EGP")}      accent="text-brandRed" />
```

with:

```jsx
          <StatCard
            label="Total spent"
            value={Object.entries(stats.spentByCurrency)
              .map(([currency, amount]) => formatPrice(amount, currency))
              .join(" + ") || formatPrice(0, "EGP")}
            accent="text-brandRed"
          />
```

- [ ] **Step 4: Manual verification**

Run both dev servers, log in as a student with at least one confirmed payment, open `/payment-history`. Confirm "Total spent" shows the correct formatted amount for the currency actually stored on that payment (not hardcoded EGP). If the fixture data only has EGP payments, the display should look identical to before this change (single formatted EGP amount).

- [ ] **Step 5: Commit**

```bash
git add client/src/user/pages/PaymentHistory.jsx
git commit -m "fix: PaymentHistory total-spent stat groups by actual payment currency"
```

---

### Task 18: Admin — fix CourseForm price label

**Files:**
- Modify: `client/src/admin/components/CourseForm.jsx:893-895`

**Interfaces:**
- None (label-only text change).

- [ ] **Step 1: Update the label**

Replace lines 893-895:

```jsx
                  <label className="text-sm font-semibold text-[#333333] px-1">
                    Course Price (USD)
                  </label>
```

with:

```jsx
                  <label className="text-sm font-semibold text-[#333333] px-1">
                    Course Price (EGP)
                  </label>
```

- [ ] **Step 2: Manual verification**

Run: `cd client && npm run dev`, open the admin Add Course form, confirm the Pricing & Visibility section now reads "Course Price (EGP)". (The `$` prefix glyph in the input itself is left as-is per the design — admin pages are out of scope for currency-symbol changes; only the mislabeled unit text is corrected here, matching what the spec calls out.)

- [ ] **Step 3: Commit**

```bash
git add client/src/admin/components/CourseForm.jsx
git commit -m "fix: correct CourseForm price label from USD to EGP"
```

---

### Task 19: Admin — remove Base Currency controls from settings pages

**Files:**
- Modify: `client/src/admin/pages/PaymentSettings.jsx`
- Modify: `client/src/admin/pages/Settings.jsx`

**Interfaces:**
- Consumes: `PaymentSettings.manualExchangeRateFallback` field (Task 4) via the existing `getPaymentSettings`/`updatePaymentSettings` API calls.

- [ ] **Step 1: `PaymentSettings.jsx` — replace the currency dropdown with a fallback-rate input**

Delete the `currencyOptions` array (lines 8-25).

Replace the `baseCurrency` field in the `formData` initial state (line 32) and in `loadSettings` (line 48) and in `handleCurrencyChange` (lines 71-76) with `manualExchangeRateFallback`:

```js
  const [formData, setFormData] = useState({
    visaMastercard: true,
    digitalWallet: true,
    cashOffline: false,
    manualExchangeRateFallback: 50,
  });
```

```js
      setFormData({
        visaMastercard: Boolean(data.visaMastercard),
        digitalWallet: Boolean(data.digitalWallet),
        cashOffline: Boolean(data.cashOffline),
        manualExchangeRateFallback: Number(data.manualExchangeRateFallback) || 50,
      });
```

Replace `handleCurrencyChange` with a numeric-input handler:

```js
  function handleFallbackRateChange(e) {
    setFormData((prev) => ({
      ...prev,
      manualExchangeRateFallback: Number(e.target.value) || 0,
    }));
  }
```

Replace the currency `<select>` block (lines 181-198 area, the one wrapped in `<div className="space-y-3 mb-8">` with the "Base Currency" label) with a numeric input:

```jsx
          <div className="space-y-3 mb-8">
            <label className="text-xs font-bold uppercase tracking-wider text-[#333333]">
              Fallback Exchange Rate (EGP per 1 USD)
            </label>

            <input
              type="number"
              min="1"
              step="0.01"
              value={formData.manualExchangeRateFallback}
              onChange={handleFallbackRateChange}
              className="w-full bg-softGrey border border-[#DDDDDD] rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-brandRed/20 focus:border-brandRed"
            />
            <p className="text-[11px] text-[#666] italic">
              Used only if the live exchange rate API is unreachable.
            </p>
          </div>
```

Replace the `<ConfigRow label="Base Currency" ... />` line with:

```jsx
              <ConfigRow label="Fallback Rate" value={`${formData.manualExchangeRateFallback} EGP/USD`} />
```

- [ ] **Step 2: `Settings.jsx` — remove the duplicate Base Currency control**

Replace `baseCurrency: "USD"` in `defaultPaymentSettings` (line 37) with `manualExchangeRateFallback: 50`.

Delete the entire Base Currency `<div className="space-y-3">...</div>` block at lines 540-557 (the one containing the `<select name="baseCurrency">`). Do not replace it with anything — `PaymentSettings.jsx` (Step 1) is now the single place this setting is edited, matching the pre-existing duplication concern noted in the design spec.

- [ ] **Step 3: Manual verification**

Run: `cd client && npm run dev`, open the admin Payment Settings page — confirm it shows a "Fallback Exchange Rate" numeric input instead of a currency dropdown, and saving it works (check Network tab: `PUT`/`PATCH` request body includes `manualExchangeRateFallback`). Open the admin Settings page — confirm the "Base Currency" selector under the Payments tab is gone entirely and the section still renders without errors.

- [ ] **Step 4: Commit**

```bash
git add client/src/admin/pages/PaymentSettings.jsx client/src/admin/pages/Settings.jsx
git commit -m "refactor: replace admin Base Currency controls with exchange-rate fallback input"
```

---

### Task 20: Admin — trim manual-transaction currency options

**Files:**
- Modify: `client/src/admin/pages/Payments.jsx:1089-1095`

**Interfaces:**
- None (options-list change only).

- [ ] **Step 1: Trim the options list**

Replace lines 1089-1095:

```jsx
              <Select
                label="Currency"
                name="currency"
                value={formData.currency}
                onChange={onChange}
                options={["USD", "EUR", "GBP", "EGP"]}
              />
```

with:

```jsx
              <Select
                label="Currency"
                name="currency"
                value={formData.currency}
                onChange={onChange}
                options={["EGP", "USD"]}
              />
```

- [ ] **Step 2: Manual verification**

Run: `cd client && npm run dev`, open the admin Payments page, open the manual transaction entry form, confirm the Currency dropdown now only offers EGP and USD.

- [ ] **Step 3: Commit**

```bash
git add client/src/admin/pages/Payments.jsx
git commit -m "refactor: trim manual transaction currency options to EGP/USD"
```

---

### Task 21: Full regression pass

**Files:** none (verification only).

- [ ] **Step 1: Run the full backend test suite**

Run: `cd server && npm test`
Expected: PASS — all suites from Tasks 1, 3, 5, 6 green (currency.test.js, geolocation.test.js, exchangeRate.test.js, currencyMiddleware.test.js).

- [ ] **Step 2: Full manual walkthrough**

With both dev servers running and no `currencyPreference` set in `localStorage`:
1. `/courses` — prices show EGP-formatted, no `$`.
2. A paid course's `/courses/:id` — price EGP-formatted, currency toggle visible, switching to USD reloads with `$`-formatted, nearest-5-rounded price.
3. `/payment?courseId=...` with USD preference set — only the Card tab shows; Kashier checkout session request carries `X-Currency-Preference: USD` and the created session's amount/currency match `convertPrice`'s output for that course.
4. `/payment-history` — "Total spent" reflects the actual currency/currencies of the logged-in user's confirmed payments.
5. Admin: Courses list, Reports, Payments pages still show `$`-prefixed EGP amounts unchanged (admin pages are explicitly out of scope for currency conversion — confirms nothing broke there).
6. Admin: Add/Edit Course form shows "Course Price (EGP)".
7. Admin: Payment Settings page shows the fallback-rate input; Settings page's duplicate Base Currency control is gone.

- [ ] **Step 3: Report status**

If all checks pass, this feature is complete. If any manual check fails, return to the relevant task above and fix before considering the plan done.

