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
