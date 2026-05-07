import { adminFetch } from "./apiClient";

export async function getPayments(filters = {}) {
  const params = new URLSearchParams();

  if (filters.search) params.append("search", filters.search);
  if (filters.status) params.append("status", filters.status);
  if (filters.method) params.append("method", filters.method);
  if (filters.date) params.append("date", filters.date);
  if (filters.page) params.append("page", filters.page);
  if (filters.limit) params.append("limit", filters.limit);

  const query = params.toString();

  return adminFetch(`/payments${query ? `?${query}` : ""}`);
}

export async function getPaymentStats() {
  return adminFetch("/payments/stats");
}

export async function getPaymentById(id) {
  return adminFetch(`/payments/${id}`);
}

export async function createPayment(paymentData) {
  return adminFetch("/payments", {
    method: "POST",
    body: JSON.stringify(paymentData),
  });
}

export async function updatePayment(id, paymentData) {
  return adminFetch(`/payments/${id}`, {
    method: "PUT",
    body: JSON.stringify(paymentData),
  });
}

export async function updatePaymentStatus(id, status) {
  return adminFetch(`/payments/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function refundPayment(id, notes = "Refund requested by admin") {
  return adminFetch(`/payments/${id}/refund`, {
    method: "PATCH",
    body: JSON.stringify({ notes }),
  });
}

export async function sendPaymentReminder(id) {
  return adminFetch(`/payments/${id}/reminder`, {
    method: "POST",
  });
}

export async function deletePayment(id) {
  return adminFetch(`/payments/${id}`, {
    method: "DELETE",
  });
}

export async function seedPayments() {
  return adminFetch("/payments/seed", {
    method: "POST",
  });
}

export async function getPaymentSettings() {
  return adminFetch("/payments/settings");
}

export async function updatePaymentSettings(settingsData) {
  return adminFetch("/payments/settings", {
    method: "PUT",
    body: JSON.stringify(settingsData),
  });
}