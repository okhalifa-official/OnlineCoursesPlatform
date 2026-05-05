import { apiFetch, saveAdminToken, clearAdminToken } from "./apiClient";

export async function loginAdmin(email, password) {
  const data = await apiFetch("/auth/admin/login", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
    }),
  });

  saveAdminToken(data.token);

  return data;
}

export async function getLoggedInAdmin() {
  return apiFetch("/auth/admin/me");
}

export function logoutAdmin() {
  clearAdminToken();
}