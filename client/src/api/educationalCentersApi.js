import { adminFetch } from "./apiClient";

export async function getEducationalCenters(filters = {}) {
  const params = new URLSearchParams();

  if (filters.search) params.append("search", filters.search);
  if (filters.status) params.append("status", filters.status);
  if (filters.city) params.append("city", filters.city);
  if (filters.size) params.append("size", filters.size);

  const query = params.toString();

  return adminFetch(`/educational-centers${query ? `?${query}` : ""}`);
}

export async function getEducationalCenterStats() {
  return adminFetch("/educational-centers/stats");
}

export async function getEducationalCenterById(id) {
  return adminFetch(`/educational-centers/${id}`);
}

export async function createEducationalCenter(centerData) {
  return adminFetch("/educational-centers", {
    method: "POST",
    body: JSON.stringify(centerData),
  });
}

export async function updateEducationalCenter(id, centerData) {
  return adminFetch(`/educational-centers/${id}`, {
    method: "PUT",
    body: JSON.stringify(centerData),
  });
}

export async function deleteEducationalCenter(id) {
  return adminFetch(`/educational-centers/${id}`, {
    method: "DELETE",
  });
}