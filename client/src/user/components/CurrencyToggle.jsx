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
