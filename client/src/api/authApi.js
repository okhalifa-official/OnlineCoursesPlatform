import {
  adminFetch,
  saveAdminToken,
  saveAdminUser,
  clearAdminAuth,
} from "./apiClient";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

async function postLogin(path, body) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || data?.error || `Login failed at ${path}`);
  }

  return data;
}

export async function loginAdmin(username, password) {
  const data = await postLogin("/auth/admin/login", {
    username,
    email: username,
    password,
  });

  if (!data?.token) {
    throw new Error("Admin login did not return token");
  }

  saveAdminToken(data.token);
  saveAdminUser(data.user);

  return data;
}

export async function loginUser(username, password) {
  const data = await postLogin("/user/login", {
    username,
    email: username,
    password,
  });

  const token = data.token || data.userToken;

  if (!token) {
    throw new Error("User login did not return token");
  }

  localStorage.removeItem("userToken");
  localStorage.removeItem("user");

  localStorage.setItem("userToken", token);
  localStorage.setItem("user", JSON.stringify(data.user || data));

  return data;
}

export async function loginUnified(username, password) {
  clearAllAuth();

  try {
    const adminData = await loginAdmin(username, password);

    return {
      type: "admin",
      data: adminData,
      redirectTo: "/dashboard",
    };
  } catch (adminError) {
    try {
      const userData = await loginUser(username, password);

      return {
        type: "user",
        data: userData,
        redirectTo: "/home",
      };
    } catch (userError) {
      throw new Error(
        `Admin error: ${adminError.message} | User error: ${userError.message}`
      );
    }
  }
}

export async function getLoggedInAdmin() {
  return adminFetch("/auth/admin/me");
}

export function logoutAdmin() {
  clearAllAuth();
}

export function clearAllAuth() {
  clearAdminAuth();

  localStorage.removeItem("userToken");
  localStorage.removeItem("user");

  localStorage.removeItem("token");
  localStorage.removeItem("admin");
  localStorage.removeItem("adminUser");
}