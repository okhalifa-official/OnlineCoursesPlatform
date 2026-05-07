import { Link } from "react-router-dom";

/**
 * Contextual learning sidebar — visible only on authenticated pages (e.g. /home).
 *
 * Layout contract:
 *   • Fixed, left-aligned, anchored BELOW the universal UserNavbar (top-14 = 56 px).
 *   • Height fills the remaining viewport: calc(100vh - 3.5rem).
 *   • The main content area must use ml-56 to avoid being hidden underneath.
 *   • z-20 keeps it above page content but below the navbar (z-30).
 *
 * Intentionally has NO logo — that responsibility belongs to UserNavbar,
 * which is always visible above this component.
 *
 * Props:
 *   links       [{ label: string, to: string, icon: ReactNode }]  — nav items
 *   activeLink  string   — label of the currently active link (not path-based)
 *   onLogout    () => void
 */
export default function UserSidebar({ links = [], activeLink, onLogout }) {
  return (
    <aside
      className="w-56 bg-charcoal flex flex-col fixed top-14 left-0 z-20 shrink-0"
      style={{ height: "calc(100vh - 3.5rem)" }}
    >
      {/* Section label — labels the nav group, not the whole sidebar */}
      <div className="px-6 pt-5 pb-3 border-b border-white/10">
        <p className="text-gray-500 text-[10px] font-semibold tracking-[0.18em] uppercase">
          My Learning
        </p>
      </div>

      {/* Primary navigation links */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto">
        {links.map((link) => {
          // Active state is determined by label match, not path, because
          // multiple links may share the same destination (e.g. /home).
          const isActive = link.label === activeLink;
          return (
            <Link
              key={link.label}
              to={link.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium mb-0.5 transition ${
                isActive
                  ? "bg-brandRed text-white"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {link.icon}
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom actions — Browse Catalogue shortcut + Sign out */}
      <div className="px-3 pb-4 space-y-1.5 border-t border-white/10 pt-3">
        {/* Takes the user to the public /courses catalogue without logging them out */}
        <Link
          to="/courses"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-white/15 text-gray-400 hover:text-white hover:bg-white/5 text-sm font-medium transition"
        >
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          Browse Catalogue
        </Link>

        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 text-sm font-medium transition"
        >
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign out
        </button>
      </div>
    </aside>
  );
}
