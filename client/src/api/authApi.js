import { adminFetch, saveAdminToken, clearAdminToken } from "./apiClient";

export async function loginAdmin(username, password) {
  const data = await adminFetch("/auth/admin/login", {
    method: "POST",
    body: JSON.stringify({
      username,
      password,
    }),
  });

  saveAdminToken(data.token);
  return data;
}

export async function getLoggedInAdmin() {
  return adminFetch("/auth/admin/me");
}

export function logoutAdmin() {
  clearAdminToken();
}