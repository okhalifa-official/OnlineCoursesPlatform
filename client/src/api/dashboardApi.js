import { apiFetch } from "./apiClient";

export async function getDashboardOverview() {
  return apiFetch("/dashboard/overview");
}

export async function getNotifications() {
  return apiFetch("/dashboard/notifications");
}

export async function getRecentActivity() {
  return apiFetch("/dashboard/recent-activity");
}

export async function getAlerts() {
  return apiFetch("/dashboard/alerts");
}

export async function getPerformance() {
  return apiFetch("/dashboard/performance");
}