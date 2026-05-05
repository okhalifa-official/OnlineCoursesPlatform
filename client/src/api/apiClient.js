const API_BASE_URL = "http://localhost:5000/api";

export function getAdminToken() {
  return localStorage.getItem("adminToken");
}

export function saveAdminToken(token) {
  localStorage.setItem("adminToken", token);
}

export function clearAdminToken() {
  localStorage.removeItem("adminToken");
}

export async function apiFetch(path, options = {}) {
  const token = getAdminToken();

  if (!token) {
    saveAdminToken("dev-admin-token");
  }

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
    clearAdminToken();
    window.location.href = "/login";
    throw new Error(data?.message || "Unauthorized");
  }

  if (!response.ok) {
    throw new Error(data?.error || data?.message || "Request failed");
  }

  return data;
}