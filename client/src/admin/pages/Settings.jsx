import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  getSettings,
  manualBackup,
  restoreData,
  updateGeneralSettings,
  updateNotificationSettings,
  updateSecuritySettings,
  getPaymentSettingsFromSettings,
  updatePaymentSettingsFromSettings,
} from "../api/settingsApi";

const defaultSystemSettings = {
  platformName: "Sono School",
  platformLanguage: "English (US)",
  platformDescription:
    "Sono School is a modern educational platform dedicated to delivering high-quality learning experiences through expert instructors and smart academic tools.",
  logoUrl: "/logo.png",
  twoFactorEnabled: true,
  sessionTimeout: "30 Minutes",
  emailAlerts: true,
  smsNotifications: false,
  systemAlerts: true,
  systemHealth: "Optimal",
  storageUsedGb: 24,
  storageTotalGb: 100,
  lastBackupAt: null,
  lastRestoreAt: null,
};

const defaultPaymentSettings = {
  visaMastercard: true,
  digitalWallet: true,
  cashOffline: false,
  baseCurrency: "USD",
};

export default function Settings() {
  const navigate = useNavigate();

  const [settings, setSettings] = useState(defaultSystemSettings);
  const [paymentSettings, setPaymentSettings] = useState(defaultPaymentSettings);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingSection, setSavingSection] = useState("");

  const storagePercent = useMemo(() => {
    const used = Number(settings.storageUsedGb || 0);
    const total = Number(settings.storageTotalGb || 100);

    if (total === 0) return 0;

    return Math.round((used / total) * 100);
  }, [settings.storageUsedGb, settings.storageTotalGb]);

  async function loadSettings() {
    try {
      setLoading(true);

      const [systemData, paymentData] = await Promise.all([
        getSettings(),
        getPaymentSettingsFromSettings(),
      ]);

      setSettings({
        ...defaultSystemSettings,
        ...systemData,
      });

      setPaymentSettings({
        ...defaultPaymentSettings,
        ...paymentData,
      });
    } catch (error) {
      alert(error.message);
      console.error("Load settings error:", error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(function () {
    loadSettings();
  }, []);

  function handleSystemChange(e) {
    const { name, value, type, checked } = e.target;

    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function handlePaymentChange(e) {
    const { name, value, type, checked } = e.target;

    setPaymentSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function saveGeneral() {
    if (!settings.platformName.trim() || !settings.platformDescription.trim()) {
      alert("Please complete the general settings fields");
      return;
    }

    try {
      setSavingSection("general");

      await updateGeneralSettings({
        platformName: settings.platformName,
        platformLanguage: settings.platformLanguage,
        platformDescription: settings.platformDescription,
        logoUrl: settings.logoUrl,
      });

      alert("General settings saved successfully");
      await loadSettings();
    } catch (error) {
      alert(error.message);
      console.error("Save general settings error:", error.message);
    } finally {
      setSavingSection("");
    }
  }

  async function saveSecurity() {
    try {
      setSavingSection("security");

      await updateSecuritySettings({
        twoFactorEnabled: settings.twoFactorEnabled,
        sessionTimeout: settings.sessionTimeout,
      });

      alert("Security settings saved successfully");
      await loadSettings();
    } catch (error) {
      alert(error.message);
      console.error("Save security settings error:", error.message);
    } finally {
      setSavingSection("");
    }
  }

  async function savePayments() {
    try {
      setSavingSection("payments");

      await updatePaymentSettingsFromSettings(paymentSettings);

      alert("Payment settings saved successfully");
      await loadSettings();
    } catch (error) {
      alert(error.message);
      console.error("Save payment settings error:", error.message);
    } finally {
      setSavingSection("");
    }
  }

  async function saveNotifications() {
    try {
      setSavingSection("notifications");

      await updateNotificationSettings({
        emailAlerts: settings.emailAlerts,
        smsNotifications: settings.smsNotifications,
        systemAlerts: settings.systemAlerts,
      });

      alert("Notification settings saved successfully");
      await loadSettings();
    } catch (error) {
      alert(error.message);
      console.error("Save notification settings error:", error.message);
    } finally {
      setSavingSection("");
    }
  }

  async function handleBackup() {
    try {
      setSavingSection("backup");

      await manualBackup();

      alert("Manual backup started successfully");
      await loadSettings();
    } catch (error) {
      alert(error.message);
      console.error("Manual backup error:", error.message);
    } finally {
      setSavingSection("");
    }
  }

  async function handleRestore() {
    const confirmed = window.confirm("Restore data from backup?");

    if (!confirmed) return;

    try {
      setSavingSection("restore");

      await restoreData();

      alert("Restore process started successfully");
      await loadSettings();
    } catch (error) {
      alert(error.message);
      console.error("Restore data error:", error.message);
    } finally {
      setSavingSection("");
    }
  }

  function sectionVisible(keywords) {
    const query = search.trim().toLowerCase();

    if (!query) return true;

    return keywords.toLowerCase().includes(query);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-softGrey flex items-center justify-center">
        <p className="font-bold text-charcoal">Loading settings...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-softGrey text-charcoal p-8">
      <div className="max-w-6xl mx-auto space-y-10">
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-extrabold heading-font">
              System Settings
            </h1>

            <p className="text-[#333333] mt-2">
              Manage platform identity, access rules, payments, notifications,
              and system maintenance.
            </p>
          </div>

          <div className="flex gap-3 flex-wrap">
            <Link
              to="/dashboard"
              className="px-5 py-3 rounded-xl bg-charcoal text-white font-bold heading-font hover:bg-brandRed transition"
            >
              Dashboard
            </Link>

            <Link
              to="/logs"
              className="px-5 py-3 rounded-xl bg-white border border-[#DDDDDD] text-charcoal font-bold heading-font hover:bg-softGrey transition"
            >
              View Logs
            </Link>

            <Link
              to="/payments"
              className="px-5 py-3 rounded-xl bg-brandRed text-white font-bold heading-font hover:opacity-90 transition"
            >
              Payments
            </Link>
          </div>
        </header>

        <section className="bg-white rounded-2xl p-5 border border-[#E5E5E5] shadow-card">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#333333]">
              search
            </span>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              type="text"
              placeholder="Search settings..."
              className="w-full h-12 rounded-xl border border-[#DDDDDD] bg-softGrey pl-12 pr-4 text-sm text-charcoal placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brandRed/15 focus:border-brandRed"
            />
          </div>
        </section>

        {sectionVisible(
          "general settings platform name language description logo branding academy"
        ) && (
          <section className="space-y-6">
            <div className="flex items-end justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-charcoal heading-font">
                  General Settings
                </h2>

                <p className="text-[#333333] text-sm mt-1">
                  Configure your academy's primary identity and localization.
                </p>
              </div>

              <button
                type="button"
                onClick={saveGeneral}
                disabled={savingSection === "general"}
                className="px-5 py-2.5 bg-brandRed text-white rounded-lg text-xs font-bold hover:opacity-90 transition-all disabled:opacity-60"
              >
                {savingSection === "general"
                  ? "Saving..."
                  : "Save General Settings"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 bg-white p-8 rounded-xl space-y-6 shadow-card border border-[#E5E5E5]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Input
                    label="Platform Name"
                    name="platformName"
                    value={settings.platformName}
                    onChange={handleSystemChange}
                  />

                  <Select
                    label="Language"
                    name="platformLanguage"
                    value={settings.platformLanguage}
                    onChange={handleSystemChange}
                    options={["English (US)", "Spanish", "French"]}
                  />

                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-[#333333] uppercase tracking-wider mb-2 block">
                      Platform Description
                    </label>

                    <textarea
                      name="platformDescription"
                      value={settings.platformDescription}
                      onChange={handleSystemChange}
                      rows="3"
                      className="w-full bg-softGrey p-3 rounded-lg border border-[#DDDDDD] focus:ring-2 focus:ring-brandRed/20 focus:border-brandRed text-sm outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-xl flex flex-col items-center justify-center space-y-4 text-center shadow-card border border-[#E5E5E5]">
                <label className="text-xs font-bold text-[#333333] uppercase tracking-wider w-full text-left mb-2">
                  Academy Logo URL
                </label>

                <div className="w-32 h-32 mx-auto rounded-2xl bg-softGrey flex items-center justify-center overflow-hidden border-2 border-dashed border-[#DDDDDD]">
                  <img
                    alt="Academy Logo"
                    className="w-20 h-20 opacity-90 object-contain"
                    src={settings.logoUrl || "/logo.png"}
                  />
                </div>

                <input
                  name="logoUrl"
                  value={settings.logoUrl}
                  onChange={handleSystemChange}
                  className="w-full bg-softGrey p-3 rounded-lg border border-[#DDDDDD] focus:ring-2 focus:ring-brandRed/20 focus:border-brandRed text-sm outline-none"
                  placeholder="/logo.png"
                />
              </div>
            </div>
          </section>
        )}

        {sectionVisible(
          "users roles admins instructors students permissions edit role hierarchy access"
        ) && (
          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-charcoal heading-font">
                Users & Roles
              </h2>

              <p className="text-[#333333] text-sm mt-1">
                Manage institutional hierarchies and access permissions.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <RoleCard
                icon="admin_panel_settings"
                title="Admins"
                description="System configuration and user management."
                badge="Full Access"
                color="red"
                actionText="Edit Role"
                onClick={() => navigate("/admin-role")}
              />

              <RoleCard
                icon="school"
                title="Instructors"
                description="Course creation, grading, and student interaction."
                badge="Content Only"
                color="green"
                actionText="Users"
                onClick={() => navigate("/users")}
              />

              <RoleCard
                icon="person"
                title="Students"
                description="Course access, participation, and progress tracking."
                badge="Learner"
                color="gray"
                actionText="Permissions"
                onClick={() => navigate("/users")}
              />
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {sectionVisible(
            "security access password two factor authentication 2fa session timeout"
          ) && (
            <section className="space-y-6">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-charcoal heading-font">
                  Security & Access
                </h2>
              </div>

              <div className="bg-white rounded-xl overflow-hidden shadow-card border border-[#E5E5E5]">
                <div className="p-6 space-y-6">
                  <ActionRow
                    icon="password"
                    title="Change Password"
                    description="Update your account password regularly"
                    buttonText="Update"
                    onClick={() => navigate("/profile/edit")}
                  />

                  <Divider />

                  <ToggleRow
                    icon="security"
                    title="Two-Factor Authentication"
                    description="Add an extra layer of security"
                    name="twoFactorEnabled"
                    checked={settings.twoFactorEnabled}
                    onChange={handleSystemChange}
                  />

                  <Divider />

                  <div className="space-y-3">
                    <label className="text-xs font-bold text-[#333333] uppercase tracking-wider">
                      Session Timeout
                    </label>

                    <div className="flex gap-3 flex-wrap">
                      <select
                        name="sessionTimeout"
                        value={settings.sessionTimeout}
                        onChange={handleSystemChange}
                        className="flex-1 min-w-[220px] bg-softGrey p-3 rounded-lg border border-[#DDDDDD] text-sm outline-none focus:ring-2 focus:ring-brandRed/20 focus:border-brandRed"
                      >
                        <option value="30 Minutes">30 Minutes</option>
                        <option value="1 Hour">1 Hour</option>
                        <option value="4 Hours">4 Hours</option>
                      </select>

                      <button
                        type="button"
                        onClick={saveSecurity}
                        disabled={savingSection === "security"}
                        className="px-5 py-3 bg-brandRed text-white rounded-lg text-xs font-bold hover:opacity-90 transition-all disabled:opacity-60"
                      >
                        {savingSection === "security"
                          ? "Saving..."
                          : "Save Security"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {sectionVisible(
            "payments currency visa mastercard wallet cash offline payment methods"
          ) && (
            <section className="space-y-6">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-charcoal heading-font">
                  Payments & Currency
                </h2>
              </div>

              <div className="bg-white rounded-xl p-6 space-y-6 shadow-card border border-[#E5E5E5]">
                <div className="space-y-4">
                  <label className="text-xs font-bold text-[#333333] uppercase tracking-wider">
                    Enable Payment Methods
                  </label>

                  <div className="space-y-3">
                    <PaymentToggle
                      icon="credit_card"
                      label="Visa / Mastercard"
                      name="visaMastercard"
                      checked={paymentSettings.visaMastercard}
                      onChange={handlePaymentChange}
                    />

                    <PaymentToggle
                      icon="account_balance_wallet"
                      label="Digital Wallet"
                      name="digitalWallet"
                      checked={paymentSettings.digitalWallet}
                      onChange={handlePaymentChange}
                    />

                    <PaymentToggle
                      icon="payments"
                      label="Cash / Offline"
                      name="cashOffline"
                      checked={paymentSettings.cashOffline}
                      onChange={handlePaymentChange}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-[#333333] uppercase tracking-wider">
                    Base Currency
                  </label>

                  <div className="flex gap-4 flex-wrap">
                    <select
                      name="baseCurrency"
                      value={paymentSettings.baseCurrency}
                      onChange={handlePaymentChange}
                      className="flex-1 min-w-[220px] bg-softGrey p-3 rounded-lg border border-[#DDDDDD] text-sm outline-none focus:ring-2 focus:ring-brandRed/20 focus:border-brandRed"
                    >
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                      <option value="EGP">EGP - Egyptian Pound</option>
                    </select>

                    <button
                      type="button"
                      onClick={savePayments}
                      disabled={savingSection === "payments"}
                      className="px-6 py-3 bg-brandRed text-white rounded-lg text-xs font-bold active:scale-95 transition-all hover:opacity-90 disabled:opacity-60"
                    >
                      {savingSection === "payments"
                        ? "Saving..."
                        : "Save Changes"}
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {sectionVisible(
            "notifications email sms alerts system notifications preferences"
          ) && (
            <section className="lg:col-span-1 space-y-6">
              <h2 className="text-xl font-bold tracking-tight text-charcoal heading-font">
                Notifications
              </h2>

              <div className="bg-white p-6 rounded-xl space-y-6 shadow-card border border-[#E5E5E5]">
                <SimpleToggle
                  label="Email Alerts"
                  name="emailAlerts"
                  checked={settings.emailAlerts}
                  onChange={handleSystemChange}
                />

                <SimpleToggle
                  label="SMS Notifications"
                  name="smsNotifications"
                  checked={settings.smsNotifications}
                  onChange={handleSystemChange}
                />

                <SimpleToggle
                  label="System Alerts"
                  name="systemAlerts"
                  checked={settings.systemAlerts}
                  onChange={handleSystemChange}
                />

                <button
                  type="button"
                  onClick={saveNotifications}
                  disabled={savingSection === "notifications"}
                  className="w-full px-4 py-3 bg-brandRed text-white rounded-lg text-xs font-bold hover:opacity-90 transition-all disabled:opacity-60"
                >
                  {savingSection === "notifications"
                    ? "Saving..."
                    : "Save Notification Settings"}
                </button>
              </div>
            </section>
          )}

          {sectionVisible(
            "system maintenance backup restore logs storage health support"
          ) && (
            <section className="lg:col-span-2 space-y-6">
              <h2 className="text-xl font-bold tracking-tight text-charcoal heading-font">
                System Maintenance
              </h2>

              <div className="bg-white rounded-xl p-8 shadow-card border border-[#E5E5E5]">
                <div className="flex flex-col md:flex-row items-center gap-10">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#FFF4E0] text-[#B98D36] rounded-lg">
                        <span className="material-symbols-outlined">
                          cloud_upload
                        </span>
                      </div>

                      <h4 className="font-bold text-charcoal heading-font">
                        Database Backup
                      </h4>
                    </div>

                    <p className="text-sm text-[#333333] leading-relaxed">
                      Ensure your academy's data is safe. Schedule automatic
                      backups or perform a manual snapshot now.
                    </p>

                    <div className="text-xs text-[#333333] space-y-1">
                      <p>
                        Last backup:{" "}
                        <strong>{formatDateTime(settings.lastBackupAt)}</strong>
                      </p>
                      <p>
                        Last restore:{" "}
                        <strong>{formatDateTime(settings.lastRestoreAt)}</strong>
                      </p>
                    </div>

                    <div className="flex gap-4 flex-wrap">
                      <button
                        type="button"
                        onClick={handleBackup}
                        disabled={savingSection === "backup"}
                        className="bg-[#B98D36] text-white px-6 py-2 rounded-lg text-xs font-bold hover:opacity-90 transition-all disabled:opacity-60"
                      >
                        {savingSection === "backup"
                          ? "Starting..."
                          : "Manual Backup"}
                      </button>

                      <button
                        type="button"
                        onClick={handleRestore}
                        disabled={savingSection === "restore"}
                        className="text-[#B98D36] px-6 py-2 rounded-lg text-xs font-bold hover:bg-[#FFF4E0] transition-all disabled:opacity-60"
                      >
                        {savingSection === "restore"
                          ? "Restoring..."
                          : "Restore Data"}
                      </button>
                    </div>
                  </div>

                  <div className="w-px h-32 bg-[#EEEEEE] hidden md:block"></div>

                  <div className="flex-1 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-charcoal heading-font">
                        System Health
                      </h4>

                      <span className="text-[10px] font-bold text-[#0A5E35] uppercase tracking-widest flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-[#0A5E35] animate-pulse"></span>
                        {settings.systemHealth}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#333333]">
                          Storage ({settings.storageUsedGb}GB /{" "}
                          {settings.storageTotalGb}GB)
                        </span>

                        <span className="font-bold">{storagePercent}%</span>
                      </div>

                      <div className="w-full bg-[#EEEEEE] h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-brandRed h-full"
                          style={{ width: `${storagePercent}%` }}
                        ></div>
                      </div>

                      <Link
                        to="/logs"
                        className="w-full flex items-center justify-center gap-2 py-2 border border-[#DDDDDD] rounded-lg text-xs font-bold hover:bg-softGrey transition-colors mt-4"
                      >
                        <span className="material-symbols-outlined text-sm">
                          list_alt
                        </span>
                        View System Logs
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}

function Input({ label, name, value, onChange }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-[#333333] uppercase tracking-wider">
        {label}
      </label>

      <input
        name={name}
        value={value || ""}
        onChange={onChange}
        className="w-full bg-softGrey p-3 rounded-lg border border-[#DDDDDD] focus:ring-2 focus:ring-brandRed/20 focus:border-brandRed text-sm outline-none"
        type="text"
      />
    </div>
  );
}

function Select({ label, name, value, onChange, options }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-[#333333] uppercase tracking-wider">
        {label}
      </label>

      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full bg-softGrey p-3 rounded-lg border border-[#DDDDDD] focus:ring-2 focus:ring-brandRed/20 focus:border-brandRed text-sm outline-none"
      >
        {options.map((option) => (
          <option value={option} key={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function RoleCard({
  icon,
  title,
  description,
  badge,
  color,
  actionText,
  onClick,
}) {
  const borderClass =
    color === "red"
      ? "border-brandRed"
      : color === "green"
      ? "border-[#0A5E35]"
      : "border-[#999999]";

  const textClass =
    color === "red"
      ? "text-brandRed"
      : color === "green"
      ? "text-[#0A5E35]"
      : "text-[#888888]";

  return (
    <div
      className={`bg-white p-6 rounded-xl space-y-4 border-l-4 ${borderClass} shadow-card`}
    >
      <div className="flex justify-between items-start">
        <span className={`material-symbols-outlined ${textClass}`}>
          {icon}
        </span>

        <span className="text-[10px] font-bold bg-softGrey text-[#333333] px-2 py-0.5 rounded uppercase">
          {badge}
        </span>
      </div>

      <div>
        <h4 className="font-bold text-charcoal heading-font">{title}</h4>
        <p className="text-xs text-[#333333]">{description}</p>
      </div>

      <div className="flex items-center justify-between pt-4">
        <div className="text-xs font-medium text-[#333333]">
          Access Management
        </div>

        <button
          type="button"
          onClick={onClick}
          className="text-xs font-bold text-brandRed hover:underline"
        >
          {actionText}
        </button>
      </div>
    </div>
  );
}

function ActionRow({ icon, title, description, buttonText, onClick }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-brandRed/10 flex items-center justify-center text-brandRed">
          <span className="material-symbols-outlined">{icon}</span>
        </div>

        <div>
          <div className="text-sm font-bold text-charcoal">{title}</div>
          <div className="text-xs text-[#333333]">{description}</div>
        </div>
      </div>

      <button
        type="button"
        onClick={onClick}
        className="px-4 py-1.5 border border-[#DDDDDD] text-xs font-bold rounded-lg hover:bg-softGrey transition-colors"
      >
        {buttonText}
      </button>
    </div>
  );
}

function ToggleRow({ icon, title, description, name, checked, onChange }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-[#0A5E35]/10 flex items-center justify-center text-[#0A5E35]">
          <span className="material-symbols-outlined">{icon}</span>
        </div>

        <div>
          <div className="text-sm font-bold text-charcoal">{title}</div>
          <div className="text-xs text-[#333333]">{description}</div>
        </div>
      </div>

      <input
        name={name}
        checked={checked}
        onChange={onChange}
        type="checkbox"
        className="w-5 h-5 accent-[#0A5E35]"
      />
    </div>
  );
}

function PaymentToggle({ icon, label, name, checked, onChange }) {
  return (
    <div className="flex items-center justify-between p-3 bg-softGrey rounded-xl">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-[#333333]">
          {icon}
        </span>

        <span className="text-sm font-medium">{label}</span>
      </div>

      <input
        name={name}
        checked={checked}
        onChange={onChange}
        className="w-5 h-5 rounded accent-[#D62828]"
        type="checkbox"
      />
    </div>
  );
}

function SimpleToggle({ label, name, checked, onChange }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium">{label}</span>

      <input
        name={name}
        checked={checked}
        onChange={onChange}
        type="checkbox"
        className="w-5 h-5 accent-[#D62828]"
      />
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-[#EEEEEE]"></div>;
}

function formatDateTime(value) {
  if (!value) return "-";

  return new Date(value).toLocaleString();
}