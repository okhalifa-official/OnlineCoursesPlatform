import { adminFetch } from "./apiClient";

export async function getSettings() {
  return adminFetch("/settings");
}

export async function updateGeneralSettings(data) {
  return adminFetch("/settings/general", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function updateSecuritySettings(data) {
  return adminFetch("/settings/security", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function updateNotificationSettings(data) {
  return adminFetch("/settings/notifications", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function manualBackup() {
  return adminFetch("/settings/backup", {
    method: "POST",
  });
}

export async function restoreData() {
  return adminFetch("/settings/restore", {
    method: "POST",
  });
}

export async function getPaymentSettingsFromSettings() {
  return adminFetch("/payments/settings");
}

export async function updatePaymentSettingsFromSettings(data) {
  return adminFetch("/payments/settings", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}