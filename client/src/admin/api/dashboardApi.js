import { adminFetch } from "./apiClient";

export async function getDashboardOverview() {
  return adminFetch("/dashboard/overview");
}

export async function getNotifications() {
  return adminFetch("/dashboard/notifications");
}

export async function getRecentActivity() {
  return adminFetch("/dashboard/recent-activity");
}

export async function getAlerts() {
  return adminFetch("/dashboard/alerts");
}

export async function getPerformance() {
  return adminFetch("/dashboard/performance");
}