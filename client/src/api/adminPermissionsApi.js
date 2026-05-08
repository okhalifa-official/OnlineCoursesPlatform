import { adminFetch } from "./apiClient";

export async function getAdminPermissions(id) {
  return adminFetch(`/users/${id}/admin-permissions`);
}

export async function updateAdminPermissions(id, data) {
  return adminFetch(`/users/${id}/admin-permissions`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}