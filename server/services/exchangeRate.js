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
