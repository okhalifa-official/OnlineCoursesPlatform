import { adminFetch } from "./apiClient";

export async function getAdminProfile() {
  return adminFetch("/admin/profile");
}

export async function updateAdminProfile(profileData) {
  return adminFetch("/admin/profile", {
    method: "PUT",
    body: JSON.stringify(profileData),
  });
}

export async function getAdminRole() {
  return adminFetch("/admin/role");
}

export async function updateAdminRole(roleData) {
  return adminFetch("/admin/role", {
    method: "PUT",
    body: JSON.stringify(roleData),
  });
}