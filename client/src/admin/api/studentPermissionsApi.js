import { adminFetch } from "./apiClient";

export async function getStudentPermissions(id) {
  return adminFetch(`/users/${id}/permissions`);
}

export async function updateStudentPermissions(id, data) {
  return adminFetch(`/users/${id}/permissions`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}