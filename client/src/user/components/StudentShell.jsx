import { Link, useLocation, useNavigate } from "react-router-dom";
import { clearUserToken, getUserInfo } from "../api/userApi";

const NAV_ITEMS = [
  {
    label: "Dashboard",
    to: "/home",
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
      </svg>
    ),
  },
  {
    label: "My Courses",
    to: "/my-courses",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    label: "Certificates",
    to: "/home",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
  },
  {
    label: "Profile",
    to: "/user-profile",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];

/**
 * Full-height dark shell used by enrolled-student pages (CourseView, LectureView).
 * Differs from UserHome's layout because there's no top UserNavbar — the sidebar
 * is anchored to the very top and contains the SonoSchool logo itself.
 *
 * Props:
 *   activeLink — label of the highlighted nav item ("My Courses" usually).
 *   children   — page content rendered to the right of the sidebar.
 */
export default function StudentShell({ activeLink = "My Courses", children }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  function handleLogout() {
    clearUserToken();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-softGrey flex">
      {/* Dark sidebar */}
      <aside className="w-56 bg-charcoal flex flex-col fixed top-0 left-0 bottom-0 z-30">
        {/* Brand */}
        <Link to="/home" className="px-6 pt-6 pb-5 flex items-center gap-2.5 border-b border-white/10">
          <div className="w-8 h-8 rounded-lg bg-brandRed flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zm-7.5 11.5v3.5L12 21l7.5-3v-3.5L12 18 4.5 14.5z" />
            </svg>
          </div>
          <div className="leading-tight">
            <p className="text-white font-heading font-bold text-base">
              Sono<span className="text-brandRed">School</span>
            </p>
            <p className="text-gray-500 text-[9px] font-bold uppercase tracking-widest">Student view</p>
          </div>
        </Link>

        {/* Nav */}
        <div className="px-6 pt-5 pb-2">
          <p className="text-gray-500 text-[10px] font-semibold tracking-[0.18em] uppercase">
            Learning
          </p>
        </div>
        <nav className="flex-1 px-3 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.label === activeLink || pathname === item.to && activeLink === item.label;
            return (
              <Link
                key={item.label}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium mb-0.5 transition ${
                  isActive
                    ? "bg-brandRed text-white"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Explore card + logout */}
        <div className="px-3 pb-4 space-y-2 border-t border-white/10 pt-3">
          <Link
            to="/courses"
            className="flex items-center gap-3 px-3 py-3 rounded-lg border border-white/15 text-gray-300 hover:text-white hover:bg-white/5 text-sm font-semibold transition"
          >
            <span className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.5 9.5l-2 5-5 2 2-5z" />
              </svg>
            </span>
            <span className="leading-tight">
              Explore
              <br />
              Courses
            </span>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-brandRed hover:bg-red-700 text-white text-sm font-bold transition"
          >
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-56 min-w-0">{children}</main>
    </div>
  );
}

export function StudentTopBar({ breadcrumb }) {
  const userInfo = getUserInfo();
  const initials = userInfo?.fullName
    ? userInfo.fullName.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";
  const chipName = (() => {
    if (!userInfo?.fullName) return "Account";
    const parts = userInfo.fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0];
    return `${parts[0]} ${parts[parts.length - 1][0]}.`;
  })();
  const subtitle = [userInfo?.jobTitle, userInfo?.specialty || userInfo?.role]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex items-start justify-between gap-6 px-8 pt-6 pb-4">
      <div className="text-sm text-gray-400 flex-1 min-w-0">{breadcrumb}</div>
      <div className="flex items-center gap-3 shrink-0">
        <button className="relative w-9 h-9 rounded-full bg-white shadow-card flex items-center justify-center">
          <svg className="w-4 h-4 text-charcoal" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brandRed" />
        </button>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-brandRed flex items-center justify-center overflow-hidden">
            {userInfo?.profileImage ? (
              <img src={userInfo.profileImage} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-bold text-white">{initials}</span>
            )}
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold text-charcoal">{chipName}</p>
            {subtitle && <p className="text-[10px] text-gray-400">{subtitle}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
