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
