import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { getUserToken, getUserInfo, clearUserToken } from "../api/userApi";
import UserLogo from "./UserLogo";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";
const NOTIF_API = `${API_BASE_URL}/user/notifications`;

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function iconForType(type) {
  const map = {
    payment_received:  { icon: "receipt_long",   color: "bg-blue-50 text-blue-600" },
    payment_verified:  { icon: "check_circle",   color: "bg-emerald-50 text-emerald-600" },
    payment_approved:  { icon: "check_circle",   color: "bg-emerald-50 text-emerald-600" },
    payment_rejected:  { icon: "cancel",         color: "bg-red-50 text-red-600" },
    enrollment:        { icon: "school",         color: "bg-emerald-50 text-emerald-600" },
    admin_message:     { icon: "campaign",       color: "bg-amber-50 text-amber-600" },
    info:              { icon: "info",           color: "bg-gray-100 text-gray-500" },
  };
  return map[type] || map.info;
}

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

  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    function onDown(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    let ignore = false;
    async function loadNotifications() {
      try {
        const token = getUserToken();
        if (!token) return;
        const response = await axios.get(NOTIF_API, { headers: { Authorization: `Bearer ${token}` } });
        if (ignore) return;
        setNotifications(response.data?.items || []);
        setUnreadCount(response.data?.unreadCount || 0);
      } catch (e) {}
    }
    loadNotifications();
    const interval = setInterval(loadNotifications, 20000);
    return () => { ignore = true; clearInterval(interval); };
  }, [isLoggedIn, tick]);

  async function markAllNotificationsRead() {
    try {
      const token = getUserToken();
      if (!token) return;
      await axios.post(`${NOTIF_API}/read-all`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (e) {}
  }

  async function handleNotificationClick(notif) {
    try {
      const token = getUserToken();
      if (token && !notif.read) {
        axios.post(`${NOTIF_API}/${notif._id}/read`, {}, { headers: { Authorization: `Bearer ${token}` } });
      }
    } catch (e) {}
    setNotifications((prev) => prev.map((n) => n._id === notif._id ? { ...n, read: true } : n));
    setUnreadCount((c) => Math.max(0, c - (notif.read ? 0 : 1)));
    setNotifOpen(false);
    if (notif.link) navigate(notif.link);
  }

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
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                title="Notifications"
                onClick={() => {
                  const willOpen = !notifOpen;
                  setNotifOpen(willOpen);
                  if (willOpen && unreadCount > 0) markAllNotificationsRead();
                }}
                className="relative w-9 h-9 rounded-full bg-softGrey hover:bg-gray-200 flex items-center justify-center transition shrink-0"
              >
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-brandRed text-white text-[10px] font-bold flex items-center justify-center px-1 border-2 border-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
                <svg className="w-5 h-5 text-charcoal" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-[calc(100%+8px)] bg-white border border-gray-100 rounded-xl shadow-lg w-80 z-50 max-h-[440px] flex flex-col">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <p className="text-sm font-bold text-charcoal">Notifications</p>
                    {notifications.length > 0 && (
                      <button
                        type="button"
                        onClick={markAllNotificationsRead}
                        className="text-[11px] text-brandRed hover:underline font-semibold"
                      >Mark all read</button>
                    )}
                  </div>

                  {notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="w-12 h-12 mx-auto rounded-full bg-softGrey flex items-center justify-center mb-2">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                      </div>
                      <p className="text-sm font-semibold text-charcoal">You're all caught up</p>
                      <p className="text-xs text-gray-500 mt-1">No new notifications yet.</p>
                    </div>
                  ) : (
                    <div className="overflow-y-auto flex-1 divide-y divide-gray-100">
                      {notifications.map((notif) => {
                        const meta = iconForType(notif.type);
                        return (
                          <button
                            key={notif._id}
                            type="button"
                            onClick={() => handleNotificationClick(notif)}
                            className={`w-full text-left px-4 py-3 hover:bg-softGrey transition flex items-start gap-3 ${notif.read ? "" : "bg-blue-50/40"}`}
                          >
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${meta.color}`}>
                              <span className="material-symbols-outlined text-lg">{meta.icon}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm ${notif.read ? "text-charcoal" : "text-charcoal font-bold"} leading-snug`}>{notif.title}</p>
                              {notif.body && (
                                <p className="text-xs text-gray-500 mt-0.5 leading-snug line-clamp-2">{notif.body}</p>
                              )}
                              <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-semibold">{timeAgo(notif.createdAt)}</p>
                            </div>
                            {!notif.read && <span className="w-2 h-2 rounded-full bg-brandRed shrink-0 mt-2" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

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
