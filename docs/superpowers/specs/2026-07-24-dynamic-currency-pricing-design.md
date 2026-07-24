# Dynamic Currency Pricing (EGP / USD)

## Problem

Course prices are stored as plain numbers on `Course.coursePrice` with no currency
tag, and displayed with a hardcoded `$` in ~12 places across student and admin
UI, even though the actual payment flows (InstaPay, Kashier) are EGP-based.
`Payment.currency` and `PaymentTransaction.currency`/`PaymentSettings.baseCurrency`
disagree on their default currency, and at least 4 separate ad hoc currency
formatters exist client-side.

We want: prices shown (and charged) in EGP for Egypt-based visitors, and in USD
— converted from the EGP price, rounded up to the nearest 5 — for everyone else,
detected automatically via IP geolocation with a manual override available.
Checkout must actually charge in the resolved currency, not just display it.

## Goals

- Replace hardcoded `$` with a currency resolved per-visitor: EGP by default,
  USD for non-Egypt visitors.
- USD price = live EGP→USD rate applied to `coursePrice`, rounded **up** to the
  nearest 5 (e.g. 400 EGP → $7.79 raw → **$10** shown/charged).
- Checkout (Kashier) charges the same resolved currency and amount that was
  displayed — computed by one shared function, never independently.
- InstaPay (EGP-only bank transfer) is hidden whenever the resolved currency
  is USD.
- A manual EGP/USD toggle lets a visitor override the automatic detection.
- Admin-facing pages (Reports, Payments, Courses list/form) always show EGP,
  the canonical stored currency — no geolocation applied there.
- Never block or fail a page/checkout because a third-party geolocation or
  exchange-rate API is slow or down.

## Non-goals

- Currencies other than EGP/USD (EUR/GBP support is being removed, not
  extended).
- Country-level pricing beyond a binary Egypt-vs-not-Egypt split.
- Historical FX-rate accuracy for past payments (existing `Payment` records
  are untouched).
- Any change to `Course.coursePrice` as the canonical EGP source of truth.

## Architecture

### 1. Currency resolution — backend middleware

A new Express middleware, `resolveCurrency`, applied to the public course
routes (`GET /api/user/courses`, `GET /api/user/courses/:id` in
`server/Routers/userAuth.js`) and the checkout route (`POST
/api/user/payments/checkout-session` in `server/Routers/userPayment.js`):

1. Check for an explicit override first: `X-Currency-Preference` request
   header (`EGP` or `USD`, case-insensitive; anything else ignored). This is
   how the frontend toggle takes effect.
2. Otherwise, resolve the request IP's country via a free-tier IP-geolocation
   API (e.g. `ip-api.com`), with a short timeout (~1.5s).
   - Egypt, or lookup failure/timeout → `EGP`.
   - Any other resolved country → `USD`.
3. Cache IP→country lookups in-memory (e.g. a `Map` with TTL, ~24h) to avoid
   repeat calls for the same visitor.
4. Attach the result as `req.resolvedCurrency`.

Local/private IPs (dev environment) resolve to `EGP` by default (geolocation
lookups skipped for non-public IPs).

### 2. Exchange rate — backend service

`server/services/exchangeRate.js`:

- Fetches EGP-per-USD from a live free-tier rate API (e.g.
  `exchangerate-api.com`'s open endpoint) using Node's built-in `fetch`.
- Caches the rate server-side with a 6–12h TTL (module-level cache, mirroring
  the existing `cachedPaymentEnv` pattern in `server/config/paymentEnv.js`).
- On fetch failure with no cache yet available, falls back to
  `PaymentSettings.manualExchangeRateFallback` (new field, see Data Model).
- Exposes `getEgpPerUsd(): Promise<number>`.

### 3. Shared conversion utility — backend

`server/utils/currency.js`:

```
convertPrice(egpAmount, targetCurrency, egpPerUsd) -> { amount, currency }
```

- `targetCurrency === "EGP"` → returns `egpAmount` unchanged.
- `targetCurrency === "USD"` → `egpAmount / egpPerUsd`, rounded **up** to the
  next multiple of 5 (`Math.ceil(raw / 5) * 5`). Free courses (`coursePrice`
  is 0 or falsy) always return `0` regardless of currency.

This is the single function used by both course display endpoints and Kashier
checkout-session creation — the displayed price and the charged price can
never drift apart because they're the same calculation, computed fresh each
time (not cached per-course), off the same rate.

### 4. Course endpoints

`server/Routers/userAuth.js` (`GET /courses`, `GET /courses/:id`): after
`resolveCurrency` runs, each course response is annotated with:

```js
{
  ...course.toObject(),
  displayPrice: <converted amount>,
  currency: <resolved currency>,
}
```

`coursePrice` remains present and unchanged for any admin/internal consumer.

### 5. Checkout (Kashier)

`server/Controllers/kashierPayment.js` — `createCheckoutSession`:

- Runs `resolveCurrency`, then computes `{ amount, currency } =
  convertPrice(course.coursePrice, req.resolvedCurrency, await
  getEgpPerUsd())`.
- Creates the `Payment` record and the Kashier hosted session with that
  `amount`/`currency` instead of the current hardcoded
  `getBaseCurrency()`/raw EGP amount. `getBaseCurrency()` /
  `PaymentSettings.baseCurrency` is removed as a concept — resolution now
  happens per-request, not as a single global setting.

### 6. InstaPay visibility

`server/Controllers/instapayPayment.js` (`getInstapayConfig`) and the
frontend `Payment.jsx` tab UI: InstaPay is only offered when
`req.resolvedCurrency === "EGP"`. For USD checkouts, only the Kashier
(card) tab is shown.

### 7. Frontend

- New `client/src/utils/currency.js`: `formatPrice(amount, currency)` using
  `Intl.NumberFormat` (replaces the ~4 duplicated formatters in `Payment.jsx`,
  `PaymentHistory.jsx`, and the raw `` `$${...}` `` interpolations).
- New shared `<Price>` component (or the `formatPrice` helper used directly)
  replaces hardcoded `$` in:
  - `CoursesPage.jsx` (`CourseCard`, lines ~247-248)
  - `CourseDetail.jsx` (pricing card, lines ~347-348)
  - `Payment.jsx` (checkout summary, `formatCurrency`)
  - `PaymentHistory.jsx` (fix the line-140 hardcoded `"EGP"` total to use the
    actual currency of the payments being summed)
- A small EGP/USD toggle (site header or near the price displays) sets the
  visitor's preference in `localStorage` and sends it as
  `X-Currency-Preference` on subsequent API calls. Defaults to "auto"
  (no header sent, i.e. geolocation decides) until the visitor explicitly
  picks one.
- Admin pages (`Reports.jsx`, `Payments.jsx` total-revenue card,
  `Courses.jsx` list/filter, `CourseForm.jsx`) are **not** touched by
  `resolveCurrency` — they keep reading raw `coursePrice`/EGP amounts
  directly, formatted with the new `formatPrice(amount, "EGP")` for
  consistency but no conversion logic. `CourseForm.jsx`'s price field label
  is corrected from "Course Price (USD)" to "Course Price (EGP)".

## Data model changes

- **`Course`**: unchanged. `coursePrice` remains the canonical EGP number.
- **`PaymentSettings`** (`server/Models/PaymentSettings.js`):
  - `baseCurrency` field removed (superseded by per-request resolution). This
    field is read in `kashierPayment.js:117-119` (`getBaseCurrency()`, removed
    per Architecture §5) and read/written in `Controllers/Payment.js:57,449`
    (settings get/update endpoints) — both call sites are updated to drop it.
    It also has admin UI in two separate places —
    `client/src/admin/pages/PaymentSettings.jsx` (a dedicated dropdown +
    `ConfigRow` display) and `client/src/admin/pages/Settings.jsx` (a
    duplicate "Base Currency" selector) — both currently editing the same
    underlying setting. Both UI controls are removed; `manualExchangeRateFallback`
    (below) replaces "Base Currency" as the one currency-related control on
    the settings page(s). (These two settings screens having overlapping
    fields predates this feature — not otherwise in scope here, but the
    currency control specifically must be removed from both, not just one.)
  - New field: `manualExchangeRateFallback: { type: Number, default: <seeded
    approx. EGP-per-USD rate> }` — admin-editable safety net used only when
    the live rate API has never successfully returned a value.
- **`Payment.currency`** (`server/Models/payment.js`) and
  **`PaymentTransaction.currency`** (`server/Models/PaymentTransaction.js`):
  enum trimmed from `["USD", "EUR", "GBP", "EGP"]` to `["USD", "EGP"]`;
  default changed to `"EGP"` on both (currently inconsistent — `EGP` vs
  `USD`).
- Admin manual-transaction-entry currency `<select>` (`Payments.jsx:1094`)
  trimmed to the same two options.

## Error handling

| Failure | Behavior |
|---|---|
| Geolocation API times out / errors | Treat as Egypt → `EGP`. Request proceeds normally. |
| Geolocation returns an unrecognized/private IP | `EGP`. |
| Exchange-rate API fails, cache has a prior value | Use the cached (stale but recent) rate. |
| Exchange-rate API fails, no cache yet (cold start) | Use `PaymentSettings.manualExchangeRateFallback`. |
| Client sends invalid `X-Currency-Preference` value | Ignored; falls through to geolocation. |
| Checkout session creation | Amount/currency always recomputed fresh from `coursePrice` + current rate at that moment — never trusts a previously displayed price from the client. |

## Testing

- Unit tests for `convertPrice()`: zero/free price, exact multiple of 5,
  values just above/below a rounding boundary, EGP passthrough.
- Unit tests for `exchangeRate.js` cache/fallback behavior (mocked fetch:
  success, failure-with-cache, failure-cold-start).
- Integration tests for `resolveCurrency` middleware: Egypt IP, US IP,
  unresolvable IP, explicit override header (valid and invalid values).
- Integration test confirming a Kashier checkout session created under a USD
  resolution produces a `Payment` with `currency: "USD"` and the same amount
  `convertPrice` would compute independently.
- Manual verification: course catalogue/detail pages render EGP by default in
  local dev (private IP), USD when the toggle is set to USD, and InstaPay tab
  disappears under USD.
