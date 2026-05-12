import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  clearUserToken,
  getUserToken,
  getMyEnrollments,
} from "../api/userApi";
import UserNavbar from "../components/UserNavbar";
import UserSidebar from "../components/UserSidebar";
import { listInstructors, formatInstructorList, stripHtmlToText } from "../components/CourseBar";

const NAV_LINKS = [
  { label: "Home",    to: "/",         section: null      },
  { label: "Courses", to: "/courses",  section: null      },
  { label: "Contact", to: "/#contact", section: "contact" },
];

const SIDEBAR_LINKS = [
  {
    label: "Dashboard",
    to: "/home",
    icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" /></svg>,
  },
  {
    label: "My Courses",
    to: "/my-courses",
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

const CATEGORY_COLORS = {
  pocus:      { from: "#6B21A8", to: "#4C1D95" },
  echo:       { from: "#7B2D2D", to: "#4A1515" },
  cardiology: { from: "#1D4ED8", to: "#1E3A8A" },
  radiology:  { from: "#065F46", to: "#064E3B" },
  emergency:  { from: "#B45309", to: "#78350F" },
  default:    { from: "#374151", to: "#1F2937" },
};

function getCategoryGradient(category) {
  if (!category) return CATEGORY_COLORS.default;
  const key = Object.keys(CATEGORY_COLORS).find((k) =>
    category.toLowerCase().includes(k)
  );
  return CATEGORY_COLORS[key] || CATEGORY_COLORS.default;
}

function EnrolledCard({ course }) {
  const { from, to } = getCategoryGradient(course.category);
  const moduleCount = Array.isArray(course.modules) ? course.modules.length : 0;
  const lectureCount = Array.isArray(course.modules)
    ? course.modules.reduce((sum, m) => sum + (m.lessons?.length || 0), 0)
    : 0;
  const instructorLabel = formatInstructorList(listInstructors(course));

  return (
    <Link
      to={`/learn/${course._id}`}
      className="bg-white rounded-2xl shadow-card overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
    >
      <div
        className="relative h-32 flex flex-col justify-end p-5 overflow-hidden"
        style={
          course.previewImage
            ? undefined
            : { background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)` }
        }
      >
        {course.previewImage && (
          <>
            <img
              src={course.previewImage}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />
          </>
        )}

        <span className="absolute top-3 right-3 z-10 bg-emerald-500 text-white text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded">
          Enrolled
        </span>

        <div className="relative z-10">
          {course.category && (
            <span className="text-white/70 text-[10px] font-semibold uppercase tracking-widest mb-1 block">
              {course.category}
            </span>
          )}
          <h3 className="font-heading font-bold text-white text-lg leading-snug line-clamp-2">
            {course.courseName}
          </h3>
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1">
        {course.courseDescription && (
          <p className="text-gray-400 text-sm leading-relaxed line-clamp-2 mb-4">
            {stripHtmlToText(course.courseDescription)}
          </p>
        )}

        <div className="flex items-center gap-3 text-[11px] text-gray-400 mb-3">
          <span>{moduleCount} module{moduleCount === 1 ? "" : "s"}</span>
          <span>·</span>
          <span>{lectureCount} lecture{lectureCount === 1 ? "" : "s"}</span>
        </div>

        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
          {instructorLabel ? (
            <p className="text-xs text-gray-400">
              by <span className="text-charcoal font-medium">{instructorLabel}</span>
            </p>
          ) : (
            <span />
          )}
          <span className="text-xs font-bold text-brandRed inline-flex items-center gap-1">
            Continue
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}

/**
 * /my-courses — Lists every course the current student is enrolled in.
 *
 * Pulls from /api/user/my-enrollments (which populates courseId), then renders
 * one card per enrollment. Cards link directly into /learn/:id.
 */
export default function MyCourses() {
  const navigate = useNavigate();

  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!getUserToken()) {
      navigate("/register", { replace: true });
      return;
    }

    getMyEnrollments()
      .then((data) => setEnrollments(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [navigate]);

  function handleLogout() {
    clearUserToken();
    navigate("/login");
  }

  // Each enrollment record has a populated courseId. Drop ones whose course
  // was deleted (courseId becomes null after populate in that case).
  const courses = enrollments
    .map((e) => e.courseId)
    .filter((c) => c && typeof c === "object");

  const filtered = courses.filter(
    (c) =>
      c.courseName?.toLowerCase().includes(search.toLowerCase()) ||
      c.category?.toLowerCase().includes(search.toLowerCase()) ||
      c.courseDescription?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-softGrey">
      <UserNavbar links={NAV_LINKS} />

      <div className="flex" style={{ minHeight: "calc(100vh - 3.5rem)" }}>
        <UserSidebar
          links={SIDEBAR_LINKS}
          activeLink="My Courses"
          onLogout={handleLogout}
        />

        <main className="flex-1 flex flex-col min-h-screen">
          <div className="sticky top-14 z-10 bg-softGrey border-b border-gray-200 px-8 py-4 flex items-center justify-between">
            <p className="text-sm text-gray-400">
              Home / <span className="text-charcoal font-medium">My Courses</span>
            </p>
            <div className="relative">
              <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search your courses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-charcoal placeholder-gray-300 focus:outline-none focus:border-brandRed w-64 transition"
              />
            </div>
          </div>

          <div className="flex-1 p-8">
            <div className="mb-8">
              <p className="text-brandRed font-semibold text-xs tracking-[0.2em] uppercase mb-1">
                Continue learning
              </p>
              <h1
                className="font-heading font-bold text-charcoal mb-1"
                style={{ fontSize: "1.875rem" }}
              >
                My Courses
              </h1>
              <p className="text-gray-400 text-sm">
                Every course you're currently enrolled in.
              </p>
            </div>

            {loading && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl shadow-card overflow-hidden animate-pulse"
                  >
                    <div className="h-32 bg-gray-200" />
                    <div className="p-5 space-y-3">
                      <div className="h-3.5 bg-gray-100 rounded w-3/4" />
                      <div className="h-3 bg-gray-100 rounded" />
                      <div className="h-3 bg-gray-100 rounded w-5/6" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-brandRed text-sm">
                {error}
              </div>
            )}

            {!loading && !error && filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <p className="font-heading font-semibold text-charcoal mb-1">
                  {search ? "No matches" : "You're not enrolled in any course yet"}
                </p>
                <p className="text-gray-400 text-sm mb-5">
                  {search
                    ? "Try a different search term."
                    : "Browse the catalogue and enroll in a free course to get started."}
                </p>
                {!search && (
                  <Link
                    to="/courses"
                    className="bg-brandRed text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-red-700 transition"
                  >
                    Browse courses
                  </Link>
                )}
              </div>
            )}

            {!loading && !error && filtered.length > 0 && (
              <>
                <p className="text-sm text-gray-400 mb-5">
                  {filtered.length} enrolled course{filtered.length !== 1 ? "s" : ""}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filtered.map((course) => (
                    <EnrolledCard key={course._id} course={course} />
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
