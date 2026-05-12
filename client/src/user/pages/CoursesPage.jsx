import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getPublishedCourses, getMyCourseIds, getUserToken } from "../api/userApi";
import UserNavbar from "../components/UserNavbar";
import { listInstructors, formatInstructorList, stripHtmlToText } from "../components/CourseBar";

const NAV_LINKS = [
  { label: "Home",    to: "/",         section: null      },
  { label: "Verify",  to: "/#verify",  section: "verify"  },
  { label: "Courses", to: "/courses",  section: null      },
  { label: "Why Us",  to: "/#why-us",  section: "why-us"  },
  { label: "Events",  to: "/#events",  section: "events"  },
  { label: "Contact", to: "/#contact", section: "contact" },
];

// Gradient colour pairs keyed by a substring of the category name.
// Matched case-insensitively so "Basic POCUS" hits the "pocus" key.
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
 * Single course card used in the catalogue grid.
 * Handles both a populated instructor object and a plain string field.
 * Price: 0 / falsy → "Free" in green; any positive value → "$X" in brandRed.
 */
function CourseCard({ course, enrolled }) {
  const { from, to } = getCategoryGradient(course.category);
  // Hide "Unassigned" and empty values, dedupe, and surface every instructor
  // (cards used to drop the second one).
  const instructorNames = listInstructors(course);
  const instructorLabel = formatInstructorList(instructorNames);

  const target = enrolled ? `/learn/${course._id}` : `/courses/${course._id}`;

  return (
    <Link
      to={target}
      className="bg-white rounded-2xl shadow-card overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
    >
      {/* Banner: shows the uploaded preview image when present, otherwise a category gradient */}
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

        {enrolled && (
          <span className="absolute top-3 right-3 z-10 bg-emerald-500 text-white text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded">
            Enrolled
          </span>
        )}

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

      {/* Card body */}
      <div className="p-5 flex flex-col flex-1">
        {course.courseDescription && (
          <p className="text-gray-400 text-sm leading-relaxed line-clamp-3 mb-4 flex-1">
            {stripHtmlToText(course.courseDescription)}
          </p>
        )}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
          {instructorLabel ? (
            <p className="text-xs text-gray-400">
              by <span className="text-charcoal font-medium">{instructorLabel}</span>
            </p>
          ) : <span />}
          <span className={`font-bold text-base ${!course.coursePrice || Number(course.coursePrice) === 0 ? "text-emerald-600" : "text-brandRed"}`}>
            {!course.coursePrice || Number(course.coursePrice) === 0 ? "Free" : `$${course.coursePrice}`}
          </span>
        </div>
      </div>
    </Link>
  );
}

/**
 * /courses — Public course catalogue.
 *
 * No auth required — the API endpoint returns all published courses
 * to anonymous visitors.
 *
 * Features:
 *   - Skeleton loading state (6 placeholder cards)
 *   - Error banner on fetch failure
 *   - Client-side search across courseName, category, courseDescription
 *   - Empty state with context-aware message (no results vs. no courses)
 */
export default function CoursesPage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [enrolledIds, setEnrolledIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // Fetch the full catalogue once on mount. The catalogue itself needs no auth,
  // but if the visitor IS logged in we also fetch their enrolled IDs so cards
  // can link directly into /learn/:id instead of the public preview.
  useEffect(() => {
    const enrolledPromise = getUserToken()
      ? getMyCourseIds().catch(() => [])
      : Promise.resolve([]);

    Promise.all([
      getPublishedCourses().catch((err) => {
        setError(err.message);
        return [];
      }),
      enrolledPromise,
    ])
      .then(([list, ids]) => {
        setCourses(Array.isArray(list) ? list : []);
        setEnrolledIds(new Set(Array.isArray(ids) ? ids : []));
      })
      .finally(() => setLoading(false));
  }, []);

  // Client-side filter — runs on every keystroke against all three text fields.
  const filtered = courses.filter(
    (c) =>
      c.courseName?.toLowerCase().includes(search.toLowerCase()) ||
      c.category?.toLowerCase().includes(search.toLowerCase()) ||
      c.courseDescription?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-softGrey">
      <UserNavbar links={NAV_LINKS} />

      {/* Page header — title, description, search input */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <p className="text-brandRed text-xs font-bold uppercase tracking-widest mb-2">
            Our curriculum
          </p>
          <h1 className="font-heading font-black text-charcoal mb-3" style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)" }}>
            All courses
          </h1>
          <p className="text-gray-400 text-sm mb-6 max-w-md">
            Browse every published course — no account needed to explore.
          </p>
          <div className="relative max-w-md">
            <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search courses or categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-charcoal placeholder-gray-300 focus:outline-none focus:border-brandRed transition bg-white"
            />
          </div>
        </div>
      </div>

      {/* Results grid */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Skeleton cards while the fetch is in flight */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-2xl shadow-card overflow-hidden animate-pulse">
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

        {/* Empty state — message differs for search vs. truly empty catalogue */}
        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-card">
              <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <p className="font-heading font-semibold text-charcoal mb-1">No courses found</p>
            <p className="text-gray-400 text-sm">
              {search ? "Try a different search term." : "Check back soon."}
            </p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <>
            <p className="text-sm text-gray-400 mb-5">
              {filtered.length} course{filtered.length !== 1 ? "s" : ""} available
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((course) => (
                <CourseCard
                  key={course._id}
                  course={course}
                  enrolled={enrolledIds.has(String(course._id))}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
