import { adminFetch } from "./apiClient";

export async function getSystemLogs(filters = {}) {
  const params = new URLSearchParams();

  if (filters.search) params.append("search", filters.search);
  if (filters.role) params.append("role", filters.role);
  if (filters.action) params.append("action", filters.action);
  if (filters.status) params.append("status", filters.status);
  if (filters.module) params.append("module", filters.module);
  if (filters.date) params.append("date", filters.date);
  if (filters.page) params.append("page", filters.page);
  if (filters.limit) params.append("limit", filters.limit);

  const query = params.toString();

  return adminFetch(`/system-logs${query ? `?${query}` : ""}`);
}

export async function getSystemLogStats() {
  return adminFetch("/system-logs/stats");
}

export async function getSystemLogById(id) {
  return adminFetch(`/system-logs/${id}`);
}