import { adminFetch } from "./apiClient";

export async function getSupportRequests(filters = {}) {
  const params = new URLSearchParams();

  if (filters.search) params.append("search", filters.search);

  if (filters.status && filters.status !== "All") {
    params.append("status", filters.status);
  }

  if (filters.issueType && filters.issueType !== "All") {
    params.append("issueType", filters.issueType);
  }

  const query = params.toString();

  return adminFetch(`/support-requests${query ? `?${query}` : ""}`);
}

export async function createSupportRequest(data) {
  return adminFetch("/support-requests", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateSupportRequest(id, data) {
  return adminFetch(`/support-requests/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteSupportRequest(id) {
  return adminFetch(`/support-requests/${id}`, {
    method: "DELETE",
  });
}