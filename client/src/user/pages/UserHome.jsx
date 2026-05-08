import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserToken, clearUserToken, getPublishedCourses } from "../api/userApi";
import UserNavbar from "../components/UserNavbar";
import UserSidebar from "../components/UserSidebar";

// Centre nav links passed to the universal navbar.
const NAV_LINKS = [
  { label: "Home",    to: "/" },
  { label: "Courses", to: "/courses" },
  { label: "Why Us",  to: "/why-us" },
];

// Per-category gradient colours for course card banners.
// Matched by substring so "Basic POCUS" hits the "pocus" key.
const CATEGORY_COLORS = {
  pocus:      { from: "#6B21A8", to: "#4C1D95" },
  echo:       { from: "#7B2D2D", to: "#4A1515" },
  cardiology: { from: "#1D4ED8", to: "#1E3A8A" },
  radiology:  { from: "#065F46", to: "#064E3B" },
  emergency:  { from: "#B45309", to: "#78350F" },
  default:    { from: "#374151", to: "#1F2937" },
};

/** Returns the { from, to } gradient pair for a given category string. */
function getCategoryGradient(category) {
  if (!category) return CATEGORY_COLORS.default;
  const key = Object.keys(CATEGORY_COLORS).find((k) =>
    category.toLowerCase().includes(k)
  );
  return CATEGORY_COLORS[key] || CATEGORY_COLORS.default;
}

/**
 * Individual course card used in the dashboard grid.
 * The banner height is fixed at h-32 with a gradient derived from the category.
 * The instructor field may arrive as a populated object or a plain string.
 */
function CourseCard({ course }) {
  const { from, to } = getCategoryGradient(course.category);
  // Handle both a populated instructor object and a raw string ID / name.
  const instructorName =
    typeof course.instructor === "object"
      ? course.instructor?.fullName
      : course.instructor;

  return (
    <div className="bg-white rounded-2xl shadow-card overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col">
      {/* Coloured banner — category label + course name */}
      <div
        className="h-32 flex flex-col justify-end p-5"
        style={{ background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)` }}
      >
        {course.category && (
          <span className="text-white/60 text-[10px] font-semibold uppercase tracking-widest mb-1">
            {course.category}
          </span>
        )}
        <h3 className="font-heading font-bold text-white text-lg leading-snug line-clamp-2">
          {course.courseName}
        </h3>
      </div>

      {/* Card body — description + instructor + price */}
      <div className="p-5 flex flex-col flex-1">
        {course.courseDescription && (
          <p className="text-gray-400 text-sm leading-relaxed line-clamp-3 mb-4 flex-1">
            {course.courseDescription}
          </p>
        )}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
          {instructorName ? (
            <p className="text-xs text-gray-400">
              by <span className="text-charcoal font-medium">{instructorName}</span>
            </p>
          ) : <span />}
          {/* Free courses show green; paid courses show brandRed */}
          <span className={`font-bold text-base ${!course.coursePrice || Number(course.coursePrice) === 0 ? "text-emerald-600" : "text-brandRed"}`}>
            {!course.coursePrice || Number(course.coursePrice) === 0 ? "Free" : `$${course.coursePrice}`}
          </span>
        </div>
      </div>
    </div>
  );
}

// Sidebar navigation items with inline SVG icons.
const SIDEBAR_LINKS = [
  {
    label: "Dashboard",
    to: "/home",
    icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" /></svg>,
  },
  {
    label: "My Courses",
    to: "/home",
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
  },
  {
    label: "Certificates",
    to: "/home",
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>,
  },
  {
    label: "Profile",
    to: "/user-profile",
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  },
];

/**
 * /home — Protected learning dashboard.
 *
 * Layout (stacked shell pattern):
 *   UserNavbar  — sticky top-0 z-30 h-14
 *   └─ flex row (min-height: calc(100vh - 3.5rem))
 *      ├─ UserSidebar  — fixed left panel, top-14, w-56
 *      └─ <main>       — ml-56 flex-1
 *           ├─ inner breadcrumb bar (sticky top-14)
 *           └─ course grid content
 *
 * Auth guard: if no userToken exists on mount, redirect to /register.
 * Course data: fetches the published catalogue (same endpoint as /courses).
 * Search: client-side filter on courseName, category, courseDescription.
 */
export default function UserHome() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    // Redirect unauthenticated visitors immediately before any fetch.
    if (!getUserToken()) {
      navigate("/register", { replace: true });
      return;
    }
    getPublishedCourses()
      .then((data) => setCourses(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  function handleLogout() {
    clearUserToken();
    navigate("/login");
  }

  // Client-side search — no debounce needed at expected catalogue sizes.
  const filtered = courses.filter(
    (c) =>
      c.courseName?.toLowerCase().includes(search.toLowerCase()) ||
      c.category?.toLowerCase().includes(search.toLowerCase()) ||
      c.courseDescription?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-softGrey">
      {/* Universal navbar spans the full width above both sidebar and content */}
      <UserNavbar links={NAV_LINKS} />

      <div className="flex" style={{ minHeight: "calc(100vh - 3.5rem)" }}>
        <UserSidebar
          links={SIDEBAR_LINKS}
          activeLink="Dashboard"
          onLogout={handleLogout}
        />

        {/* Main content — offset by the sidebar width */}
        <main className="flex-1 flex flex-col min-h-screen">
          {/* Breadcrumb + search bar — sticks below the universal navbar */}
          <div className="sticky top-14 z-10 bg-softGrey border-b border-gray-200 px-8 py-4 flex items-center justify-between">
            <p className="text-sm text-gray-400">
              Home / <span className="text-charcoal font-medium">Dashboard</span>
            </p>
            <div className="relative">
              <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search courses, lectures..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-charcoal placeholder-gray-300 focus:outline-none focus:border-brandRed w-64 transition"
              />
            </div>
          </div>

          {/* Page content area */}
          <div className="flex-1 p-8">
            <div className="mb-8">
              <p className="text-brandRed font-semibold text-xs tracking-[0.2em] uppercase mb-1">
                Welcome Back
              </p>
              <h1 className="font-heading font-bold text-charcoal mb-1" style={{ fontSize: "1.875rem" }}>
                Explore all courses.
              </h1>
              <p className="text-gray-400 text-sm">Browse our full catalog of published courses below.</p>
            </div>

            {/* Loading skeleton — 6 placeholder cards matching the real card size */}
            {loading && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white rounded-2xl shadow-card overflow-hidden animate-pulse">
                    <div className="h-32 bg-gray-200" />
                    <div className="p-5 space-y-3">
                      <div className="h-3.5 bg-gray-100 rounded w-3/4" />
                      <div className="h-3 bg-gray-100 rounded" />
                      <div className="h-3 bg-gray-100 rounded w-5/6" />
                      <div className="flex justify-between pt-2">
                        <div className="h-3 bg-gray-100 rounded w-24" />
                        <div className="h-3 bg-gray-100 rounded w-12" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && error && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-brandRed text-sm">
                <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
                {error}
              </div>
            )}

            {/* Empty state — different message when a search yielded no results */}
            {!loading && !error && filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <p className="font-heading font-semibold text-charcoal mb-1">No courses found</p>
                <p className="text-gray-400 text-sm">
                  {search ? "Try a different search term." : "Check back soon for new courses."}
                </p>
              </div>
            )}

            {!loading && !error && filtered.length > 0 && (
              <>
                <p className="text-sm text-gray-400 mb-5">
                  {filtered.length} course{filtered.length !== 1 ? "s" : ""} available
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filtered.map((course) => (
                    <CourseCard key={course._id} course={course} />
                  ))}
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
