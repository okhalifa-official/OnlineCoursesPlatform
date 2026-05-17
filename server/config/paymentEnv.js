function readRequiredEnv(name) {
  const value = process.env[name];

  if (!value || !String(value).trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return String(value).trim();
}

function readOptionalEnv(name, fallback) {
  const value = process.env[name];

  if (!value || !String(value).trim()) {
    return fallback;
  }

  return String(value).trim();
}

function readUrlEnv(name) {
  const value = readRequiredEnv(name);

  try {
    return new URL(value).toString();
  } catch (error) {
    throw new Error(`Invalid URL in environment variable ${name}`);
  }
}

function validatePaymentEnv() {
  const mode = readOptionalEnv("KASHIER_MODE", "test").toLowerCase();

  if (!["test", "live"].includes(mode)) {
    throw new Error("KASHIER_MODE must be either 'test' or 'live'");
  }

  return {
    db: readRequiredEnv("DB"),
    jwtSecret: readRequiredEnv("JWT_SECRET"),
    kashierApiKey: readRequiredEnv("KASHIER_API_KEY"),
    kashierSecretKey: readRequiredEnv("KASHIER_SECRET_KEY"),
    kashierMerchantId: readRequiredEnv("KASHIER_MERCHANT_ID"),
    kashierMerchantRedirectUrl: readUrlEnv("KASHIER_MERCHANT_REDIRECT_URL"),
    kashierServerWebhookUrl: readUrlEnv("KASHIER_SERVER_WEBHOOK_URL"),
    kashierMode: mode,
    kashierAllowedMethods: readOptionalEnv(
      "KASHIER_ALLOWED_METHODS",
      "card"
    ),
    kashierDisplayLanguage: readOptionalEnv(
      "KASHIER_DISPLAY_LANGUAGE",
      "en"
    ).toLowerCase(),
  };
}

let cachedPaymentEnv = null

function getPaymentEnv() {
  if (!cachedPaymentEnv) {
    cachedPaymentEnv = validatePaymentEnv()
  }

  return cachedPaymentEnv
}

module.exports = {
  getPaymentEnv,
  validatePaymentEnv,
};