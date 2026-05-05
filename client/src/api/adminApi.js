import { apiFetch } from "./apiClient";

export async function getAdminProfile() {
  return apiFetch("/admin/profile");
}

export async function updateAdminProfile(profileData) {
  return apiFetch("/admin/profile", {
    method: "PUT",
    body: JSON.stringify(profileData),
  });
}

export async function getAdminRole() {
  return apiFetch("/admin/role");
}

export async function updateAdminRole(roleData) {
  return apiFetch("/admin/role", {
    method: "PUT",
    body: JSON.stringify(roleData),
  });
}