const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

export function getAdminToken() {
  return localStorage.getItem("adminToken");
}

export function saveAdminToken(token) {
  localStorage.removeItem("adminToken");
  localStorage.removeItem("adminUser");

  localStorage.setItem("adminToken", token);
}

export function saveAdminUser(user) {
  localStorage.setItem("adminUser", JSON.stringify(user));
}

export function getAdminUser() {
  const user = localStorage.getItem("adminUser");

  if (!user) {
    return null;
  }

  try {
    return JSON.parse(user);
  } catch (error) {
    return null;
  }
}

export function clearAdminAuth() {
  localStorage.removeItem("adminToken");
  localStorage.removeItem("adminUser");
}

export function clearAdminToken() {
  clearAdminAuth();
}

export async function adminFetch(path, options = {}) {
  const token = getAdminToken();

  const headers = {
    ...(options.headers || {}),
  };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(function () {
    return null;
  });

  if (response.status === 401 || response.status === 403) {
    clearAdminAuth();

    if (window.location.pathname !== "/login") {
      window.location.href = "/login";
    }

    throw new Error(data?.message || "Unauthorized");
  }

  if (!response.ok) {
    throw new Error(data?.error || data?.message || "Request failed");
  }

  return data;
}