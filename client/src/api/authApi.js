import { apiFetch, saveAdminToken, clearAdminToken } from "./apiClient";

export async function loginAdmin(email, password) {
  // bypass backend auth for development purposes
  if (
    email.trim() === "admin@sonoschool.com" &&
    password.trim() === "admin123"
  ) {
    const fakeData = {
      token: "dev-admin-token",
      user: { role: "admin" },
    };

    saveAdminToken(fakeData.token);
    return fakeData;
  }

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