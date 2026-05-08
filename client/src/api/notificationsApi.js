import { adminFetch } from "./apiClient";

export async function getLatestNotifications() {
  return adminFetch("/dashboard/notifications");
}

export async function getAllNotifications() {
  return adminFetch("/dashboard/notifications/all");
}