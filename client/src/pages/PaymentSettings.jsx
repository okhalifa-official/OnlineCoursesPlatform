import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getPaymentSettings,
  updatePaymentSettings,
} from "../api/paymentsApi";

const currencyOptions = [
  {
    value: "USD",
    label: "USD - US Dollar",
  },
  {
    value: "EUR",
    label: "EUR - Euro",
  },
  {
    value: "GBP",
    label: "GBP - British Pound",
  },
  {
    value: "EGP",
    label: "EGP - Egyptian Pound",
  },
];

export default function PaymentSettings() {
  const [formData, setFormData] = useState({
    visaMastercard: true,
    digitalWallet: true,
    cashOffline: false,
    baseCurrency: "USD",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadSettings() {
    try {
      setLoading(true);

      const data = await getPaymentSettings();

      setFormData({
        visaMastercard: Boolean(data.visaMastercard),
        digitalWallet: Boolean(data.digitalWallet),
        cashOffline: Boolean(data.cashOffline),
        baseCurrency: data.baseCurrency || "USD",
      });
    } catch (error) {
      alert(error.message);
      console.error("Load payment settings error:", error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(function () {
    loadSettings();
  }, []);

  function handleCheckboxChange(e) {
    const { name, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  }

  function handleCurrencyChange(e) {
    setFormData((prev) => ({
      ...prev,
      baseCurrency: e.target.value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setSaving(true);

      await updatePaymentSettings(formData);

      alert("Payment settings saved successfully");
      await loadSettings();
    } catch (error) {
      alert(error.message);
      console.error("Save payment settings error:", error.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-softGrey flex items-center justify-center">
        <p className="font-bold text-charcoal">Loading payment settings...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-softGrey px-6 py-10 text-charcoal">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <Link
            to="/payments"
            className="inline-flex items-center gap-2 text-brandRed font-bold hover:underline"
          >
            <span className="material-symbols-outlined text-[20px]">
              arrow_back
            </span>
            Back to Payments
          </Link>

          <Link
            to="/logs"
            className="inline-flex items-center gap-2 rounded-xl bg-charcoal text-white px-5 py-3 text-sm font-bold heading-font hover:bg-brandRed transition"
          >
            <span className="material-symbols-outlined text-[20px]">
              receipt_long
            </span>
            View Logs
          </Link>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl border border-[#DDDDDD] shadow-card p-8"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center text-brandRed">
              <span className="material-symbols-outlined text-[28px]">
                payments
              </span>
            </div>

            <div>
              <h1 className="text-3xl font-extrabold heading-font text-charcoal">
                Payments & Currency
              </h1>

              <p className="text-sm text-[#333333] mt-1">
                Manage payment methods and set the base platform currency.
              </p>
            </div>
          </div>

          <div className="space-y-6 mb-8">
            <h2 className="text-lg font-bold heading-font">
              Enable Payment Methods
            </h2>

            <PaymentToggle
              icon="credit_card"
              label="Visa / Mastercard"
              name="visaMastercard"
              checked={formData.visaMastercard}
              onChange={handleCheckboxChange}
            />

            <PaymentToggle
              icon="account_balance_wallet"
              label="Digital Wallet"
              name="digitalWallet"
              checked={formData.digitalWallet}
              onChange={handleCheckboxChange}
            />

            <PaymentToggle
              icon="payments"
              label="Cash / Offline"
              name="cashOffline"
              checked={formData.cashOffline}
              onChange={handleCheckboxChange}
            />
          </div>

          <div className="space-y-3 mb-8">
            <label className="text-xs font-bold uppercase tracking-wider text-[#333333]">
              Base Currency
            </label>

            <select
              name="baseCurrency"
              value={formData.baseCurrency}
              onChange={handleCurrencyChange}
              className="w-full bg-softGrey border border-[#DDDDDD] rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-brandRed/20 focus:border-brandRed"
            >
              {currencyOptions.map((currency) => (
                <option value={currency.value} key={currency.value}>
                  {currency.label}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-xl bg-softGrey border border-[#DDDDDD] p-4 mb-8">
            <p className="text-xs font-bold uppercase tracking-wider text-[#333333] mb-2">
              Current Configuration
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <ConfigRow
                label="Visa / Mastercard"
                value={formData.visaMastercard ? "Enabled" : "Disabled"}
              />
              <ConfigRow
                label="Digital Wallet"
                value={formData.digitalWallet ? "Enabled" : "Disabled"}
              />
              <ConfigRow
                label="Cash / Offline"
                value={formData.cashOffline ? "Enabled" : "Disabled"}
              />
              <ConfigRow label="Base Currency" value={formData.baseCurrency} />
            </div>
          </div>

          <div className="flex gap-4 justify-end">
            <Link
              to="/payments"
              className="px-6 py-3 border border-[#DDDDDD] rounded-lg font-semibold hover:bg-softGrey"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-brandRed text-white rounded-lg font-bold hover:opacity-90 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

function PaymentToggle({ icon, label, name, checked, onChange }) {
  return (
    <label className="flex items-center justify-between bg-softGrey rounded-xl p-4 border border-[#DDDDDD]">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined">{icon}</span>
        <span className="text-sm font-medium">{label}</span>
      </div>

      <input
        name={name}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-5 h-5 accent-[#D62828]"
      />
    </label>
  );
}

function ConfigRow({ label, value }) {
  return (
    <div className="flex items-center justify-between bg-white rounded-lg px-4 py-3">
      <span className="text-[#333333]">{label}</span>
      <span className="font-bold text-charcoal">{value}</span>
    </div>
  );
}