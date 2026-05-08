// Base URL for all user API calls. Matches the Express server port.
const API_BASE_URL = "http://localhost:4000/api";

// ─── Token & user-info helpers ────────────────────────────────────────────────
// userToken and userInfo are stored separately from adminToken so the two
// sessions never interfere with each other.

/** Returns the stored JWT or null if the user is not logged in. */
export function getUserToken() {
  return localStorage.getItem("userToken");
}

/** Persists the JWT received after a successful login or registration. */
export function saveUserToken(token) {
  localStorage.setItem("userToken", token);
}

/** Persists the user object (fullName, role, etc.) so the navbar can show
 *  the user's name/initials chip without an extra API round-trip.
 *  Wrapped in try/catch because large profileImage base64 strings can
 *  exceed the per-origin localStorage quota on some browsers. */
export function saveUserInfo(user) {
  try {
    localStorage.setItem("userInfo", JSON.stringify(user));
  } catch (_) {
    // Quota exceeded — store without the image so at least the name shows
    try {
      const { profileImage: _omit, ...rest } = user;
      localStorage.setItem("userInfo", JSON.stringify(rest));
    } catch (__) { /* nothing we can do */ }
  }
}

/** Returns the stored user object, or null if not available / parse fails. */
export function getUserInfo() {
  try { return JSON.parse(localStorage.getItem("userInfo")); }
  catch { return null; }
}

/** Removes both the token and the cached user object.
 *  Always called together — leaving a stale userInfo with no token would
 *  cause the navbar to show a name for a logged-out user. */
export function clearUserToken() {
  localStorage.removeItem("userToken");
  localStorage.removeItem("userInfo");
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────

/**
 * Wraps fetch with:
 *   - Automatic JSON Content-Type (skipped for FormData payloads)
 *   - Authorization header when a token exists
 *   - Consistent error throwing from the API's error/message field
 *   - Hard redirect to /login on 401/403 (session expired or revoked)
 *
 * @param {string} path    — API path, e.g. "/user/login"
 * @param {object} options — Standard fetch options (method, body, headers, …)
 */
export async function userApiFetch(path, options = {}) {
  const token = getUserToken();

  const headers = { ...(options.headers || {}) };

  // Don't set Content-Type for FormData — browser must set it with the boundary.
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  // Attempt to parse JSON; fall back to null if the body is empty or malformed.
  const data = await response.json().catch(() => null);

  // Session expired or forbidden — clear local state and force re-login.
  if (response.status === 401 || response.status === 403) {
    clearUserToken();
    window.location.href = "/login";
    throw new Error(data?.message || "Unauthorized");
  }

  if (!response.ok) {
    throw new Error(data?.error || data?.message || "Request failed");
  }

  return data;
}

// ─── Domain-level API calls ───────────────────────────────────────────────────

/**
 * Creates a new user account. Sends the full form object from UserRegister
 * (all 3 steps merged into one flat payload).
 */
export async function registerUser(userData) {
  return userApiFetch("/user/register", {
    method: "POST",
    body: JSON.stringify(userData),
  });
}

/** Authenticates with email + password and returns { token, user }. */
export async function loginUser({ email, password }) {
  return userApiFetch("/user/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

/** Fetches the publicly visible course catalogue.
 *  No auth required — accessible to anonymous visitors on /courses. */
export async function getPublishedCourses() {
  return userApiFetch("/user/courses");
}

/** Fetches the authenticated user's full profile from the server. */
export async function getUserProfile() {
  return userApiFetch("/user/me");
}

/** Updates the authenticated user's profile fields. */
export async function updateUserProfile(data) {
  return userApiFetch("/user/profile", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/** Fetches the authenticated user's course enrollments. */
export async function getMyEnrollments() {
  return userApiFetch("/user/my-enrollments");
}
