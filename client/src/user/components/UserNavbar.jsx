import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { getUserToken, getUserInfo, clearUserToken } from "../api/userApi";
import UserLogo from "./UserLogo";

const ABOUT_LINKS = [
  { label: "Mission & Vision",     href: "/about/mission-vision"      },
  { label: "Board of Directors",   href: "/about/board-of-directors"  },
  { label: "MENA Board",           href: "/about/mena-board"          },
  { label: "Scientific Committee", href: "/about/scientific-committee" },
  { label: "Clinical Advisors",    href: "/about/clinical-advisors"   },
  { label: "Business Partners",    href: "/about/business-partners"   },
  { label: "Scientific Partners",  href: "/about/scientific-partners" },
  { label: "Policies",             href: "/about/policies"            },
];

/**
 * Universal top navigation bar — present on every user-facing page.
 *
 * Right side adapts to auth state:
 *   • Logged out → "Sign in" and "Get started" links
 *   • Logged in  → notification bell + user chip (avatar + name + subtitle)
 *                  with dropdown (My Dashboard, Profile, Sign out)
 *
 * Listens for the "userInfoUpdated" custom event so that profile photo and
 * name changes made on the Profile page are reflected without a full reload.
 *
 * Props:
 *   links  [{ label: string, to: string }]  — centre nav items
 */
export default function UserNavbar({ links = [] }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Tick counter used to re-read localStorage whenever userInfo changes.
  const [tick, setTick] = useState(0);

  useEffect(() => {
    function onUpdate() { setTick((t) => t + 1); }
    window.addEventListener("userInfoUpdated", onUpdate);
    return () => window.removeEventListener("userInfoUpdated", onUpdate);
  }, []);

  const isLoggedIn = !!getUserToken();
  const userInfo = getUserInfo();

  const [open, setOpen] = useState(false);
  const dropRef = useRef(null);

  const [aboutOpen, setAboutOpen] = useState(false);
  const aboutRef = useRef(null);

  useEffect(() => {
    function onDown(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false);
      if (aboutRef.current && !aboutRef.current.contains(e.target)) setAboutOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // ── Scroll-spy: track which section is currently in the viewport ──────────
  const [activeSection, setActiveSection] = useState(null);

  useEffect(() => {
    const sectionIds = links.filter((l) => l.section).map((l) => l.section);
    if (sectionIds.length === 0) return;

    // Reset to "home" when the user scrolls back to the very top
    function onScroll() {
      if (window.scrollY < 80) setActiveSection(null);
    }
    window.addEventListener("scroll", onScroll, { passive: true });

    // Highlight whichever section occupies the middle band of the viewport
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: "-35% 0px -35% 0px", threshold: 0 }
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => {
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, [links]);

  function handleLogout() {
    clearUserToken();
    setOpen(false);
    navigate("/login");
  }

  const initials = userInfo?.fullName
    ? userInfo.fullName.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  // Truncate name to "Dr. Sara A." style for the chip
  const chipName = (() => {
    if (!userInfo?.fullName) return "Account";
    const parts = userInfo.fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0];
    return `${parts[0]} ${parts[parts.length - 1][0]}.`;
  })();

  // Subtitle line: jobTitle · specialty or role
  const chipSubtitle = (() => {
    const parts = [userInfo?.jobTitle, userInfo?.specialty || userInfo?.role].filter(Boolean);
    return parts.join(" · ");
  })();

  const profileImage = userInfo?.profileImage || "";

  return (
    <nav className="w-full bg-white border-b border-gray-100 sticky top-0 z-30 h-14">
      <div className="h-full px-6 flex items-center justify-between gap-6">
        {/* Brand logo */}
        <Link to="/" className="shrink-0">
          <UserLogo />
        </Link>

        {/* Centre links */}
        <div className="hidden md:flex items-center gap-6 flex-1">
          {links.map((link) => {
            if (link.section) {
              const isActive = activeSection === link.section;
              return (
                <button
                  key={link.label}
                  onClick={() => {
                    setActiveSection(link.section);
                    if (pathname === "/") {
                      document.getElementById(link.section)?.scrollIntoView({ behavior: "smooth" });
                    } else {
                      navigate(link.to);
                    }
                  }}
                  className={`text-sm font-medium transition ${
                    isActive ? "text-brandRed" : "text-charcoal hover:text-brandRed"
                  }`}
                >
                  {link.label}
                </button>
              );
            }

            // Non-section link: active when pathname matches AND no section is
            // currently highlighted (prevents "Home" staying red while a section is active)
            const isActive =
              pathname === link.to &&
              !(link.to === "/" && activeSection !== null);

            return (
              <Link
                key={link.label}
                to={link.to}
                onClick={() => setActiveSection(null)}
                className={`text-sm font-medium transition ${
                  isActive ? "text-brandRed" : "text-charcoal hover:text-brandRed"
                }`}
              >
                {link.label}
              </Link>
            );
          })}

          {/* About dropdown */}
          <div className="relative" ref={aboutRef}>
            <button
              onClick={() => setAboutOpen((v) => !v)}
              className={`flex items-center gap-1 text-sm font-medium transition ${
                pathname.startsWith("/about") ? "text-brandRed" : "text-charcoal hover:text-brandRed"
              }`}
            >
              About
              <svg
                className={`w-3 h-3 transition-transform duration-200 ${aboutOpen ? "rotate-180" : ""}`}
                fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {aboutOpen && (
              <div className="absolute left-0 top-[calc(100%+12px)] bg-white border border-gray-100 rounded-2xl shadow-card py-1.5 w-56 z-50">
                {ABOUT_LINKS.map((item, i) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setAboutOpen(false)}
                    className={`flex items-center justify-between px-4 py-2.5 text-sm text-charcoal hover:bg-softGrey hover:text-brandRed transition group
                      ${i !== ABOUT_LINKS.length - 1 ? "border-b border-gray-50" : ""}`}
                  >
                    {item.label}
                    <svg className="w-3 h-3 text-gray-300 group-hover:text-brandRed transition" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right side */}
        {isLoggedIn ? (
          <div className="flex items-center gap-3 shrink-0" ref={dropRef}>
            {/* My Learning shortcut */}
            <Link
              to="/home"
              className={`hidden sm:block text-sm font-medium transition ${
                pathname === "/home" ? "text-brandRed" : "text-charcoal hover:text-brandRed"
              }`}
            >
              My Learning
            </Link>

            {/* Notification bell */}
            <button className="relative w-9 h-9 rounded-full bg-softGrey hover:bg-gray-200 flex items-center justify-center transition shrink-0">
              <svg className="w-5 h-5 text-charcoal" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>

            {/* User chip + dropdown */}
            <div className="relative">
              <button
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-2 bg-softGrey hover:bg-gray-200 rounded-xl pl-1 pr-3 py-1 transition"
              >
                {/* Avatar circle: photo or initials */}
                <div className="w-8 h-8 rounded-full bg-brandRed flex items-center justify-center overflow-hidden shrink-0">
                  {profileImage ? (
                    <img src={profileImage} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-bold text-white">{initials}</span>
                  )}
                </div>

                {/* Name + subtitle */}
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-charcoal leading-tight">{chipName}</p>
                  {chipSubtitle && (
                    <p className="text-[10px] text-gray-400 leading-tight">{chipSubtitle}</p>
                  )}
                </div>

                <svg
                  className={`w-3 h-3 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
                  fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown */}
              {open && (
                <div className="absolute right-0 top-[calc(100%+8px)] bg-white border border-gray-100 rounded-xl shadow-card py-1.5 min-w-48 z-50">
                  {/* Identity header */}
                  <div className="px-4 py-3 border-b border-gray-100 mb-1 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brandRed flex items-center justify-center overflow-hidden shrink-0">
                      {profileImage ? (
                        <img src={profileImage} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm font-bold text-white">{initials}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-charcoal truncate">{userInfo?.fullName ?? "Account"}</p>
                      <p className="text-[10px] text-gray-400 truncate capitalize">{chipSubtitle || userInfo?.role || ""}</p>
                    </div>
                  </div>

                  {/* My Dashboard */}
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

                  {/* Profile */}
                  <Link
                    to="/user-profile"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-charcoal hover:bg-softGrey transition"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Profile
                  </Link>

                  {/* Sign out */}
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
