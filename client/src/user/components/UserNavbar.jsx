import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { getUserToken, getUserInfo, clearUserToken } from "../api/userApi";
import UserLogo from "./UserLogo";

/**
 * Universal top navigation bar — present on every user-facing page, both
 * public (landing, /courses, /why-us) and authenticated (/home).
 *
 * The right side adapts at render time based on whether a userToken exists:
 *   • Logged out → "Sign in" and "Get started" links
 *   • Logged in  → "My Learning" shortcut + user-chip (avatar + name) with a
 *                  dropdown menu (My Dashboard, Sign out)
 *
 * Layout: sticky top-0 z-30 h-14  — the sidebar anchors at top-14 below this.
 *
 * Props:
 *   links  [{ label: string, to: string }]  — centre nav items
 */
export default function UserNavbar({ links = [] }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Read auth state synchronously from localStorage on each render.
  const isLoggedIn = !!getUserToken();
  const userInfo = getUserInfo();

  // Dropdown open/close state for the user chip menu.
  const [open, setOpen] = useState(false);
  const dropRef = useRef(null);

  // Close the dropdown when the user clicks outside the chip area.
  useEffect(() => {
    function onDown(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  function handleLogout() {
    clearUserToken();
    setOpen(false);
    navigate("/login");
  }

  // Build initials from the stored fullName (max 2 characters, uppercase).
  // Falls back to "?" when userInfo is unavailable.
  const initials = userInfo?.fullName
    ? userInfo.fullName.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  // First word of fullName used as the display name in the chip.
  const firstName = userInfo?.fullName?.split(" ")[0] ?? "Account";

  return (
    <nav className="w-full bg-white border-b border-gray-100 sticky top-0 z-30 h-14">
      <div className="h-full px-6 flex items-center justify-between gap-6">
        {/* Brand logo — navigates to / on click */}
        <UserLogo />

        {/* Centre links — hidden on small screens */}
        <div className="hidden md:flex items-center gap-6 flex-1">
          {links.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className={`text-sm font-medium transition ${
                pathname === link.to ? "text-brandRed" : "text-charcoal hover:text-brandRed"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side — different UI depending on auth state */}
        {isLoggedIn ? (
          <div className="flex items-center gap-3 shrink-0" ref={dropRef}>
            {/* Quick shortcut to the learning dashboard */}
            <Link
              to="/home"
              className={`hidden sm:block text-sm font-medium transition ${
                pathname === "/home" ? "text-brandRed" : "text-charcoal hover:text-brandRed"
              }`}
            >
              My Learning
            </Link>

            {/* User chip — avatar circle + first name + chevron */}
            <div className="relative">
              <button
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-2 bg-softGrey hover:bg-gray-200 rounded-full pl-1 pr-3 py-1 transition"
              >
                {/* Red circle with the user's initials */}
                <div className="w-7 h-7 bg-brandRed rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {initials}
                </div>
                <span className="text-sm font-medium text-charcoal hidden sm:block">{firstName}</span>
                {/* Chevron rotates when the dropdown is open */}
                <svg
                  className={`w-3 h-3 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
                  fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown — rendered below the chip, aligned to the right edge */}
              {open && (
                <div className="absolute right-0 top-[calc(100%+8px)] bg-white border border-gray-100 rounded-xl shadow-card py-1.5 min-w-44 z-50">
                  {/* User identity header row */}
                  <div className="px-4 py-2 border-b border-gray-100 mb-1">
                    <p className="text-xs font-semibold text-charcoal truncate">{userInfo?.fullName ?? "Account"}</p>
                    <p className="text-xs text-gray-400 truncate capitalize">{userInfo?.role ?? ""}</p>
                  </div>
                  <Link
                    to="/home"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-charcoal hover:bg-softGrey transition"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
                    </svg>
                    My Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-brandRed hover:bg-red-50 transition"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Logged-out state — Sign in + Get started */
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/login"
              className="text-sm font-semibold text-charcoal border border-gray-200 rounded-lg px-4 py-1.5 hover:bg-softGrey transition"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="text-sm font-semibold text-white bg-brandRed rounded-lg px-4 py-1.5 hover:bg-red-700 transition"
            >
              Get started
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
