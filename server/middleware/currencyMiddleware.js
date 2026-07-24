const geolocation = require("../services/geolocation");

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

    const countryCode = await geolocation.resolveCountryFromIp(req.ip);
    req.resolvedCurrency = countryCode && countryCode !== EGYPT_COUNTRY_CODE ? "USD" : "EGP";

    return next();
  } catch (error) {
    req.resolvedCurrency = "EGP";
    return next();
  }
}

module.exports = { resolveCurrency };
