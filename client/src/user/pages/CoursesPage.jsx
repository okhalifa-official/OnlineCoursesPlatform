import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getPublishedCourses, getMyCourseIds, getUserToken } from "../api/userApi";
import UserNavbar from "../components/UserNavbar";
import usePageTitle from "../hooks/usePageTitle";
import { listInstructors, formatInstructorList, stripHtmlToText } from "../components/CourseBar";

const NAV_LINKS = [
  { label: "Home",    to: "/",         section: null      },
  { label: "Verify",  to: "/#verify",  section: "verify"  },
  { label: "Courses", to: "/courses",  section: null      },
  { label: "Why Us",  to: "/#why-us",  section: "why-us"  },
  { label: "Events",  to: "/#events",  section: "events"  },
  { label: "Contact", to: "/#contact", section: "contact" },
];

const MEDICAL_SPECIALTIES = [
  "Emergency Medicine",
  "Internal Medicine",
  "Cardiology",
  "Radiology",
  "Critical Care",
  "Anesthesiology",
  "General Surgery",
  "Pediatrics",
  "Obstetrics & Gynecology",
  "Orthopedics",
  "Neurology",
  "Oncology",
  "Nephrology",
  "Pulmonology",
  "Gastroenterology",
  "Rheumatology",
  "Other",
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

const SORT_OPTIONS = [
  {
    value: "newest",
    label: "Newest",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    value: "az",
    label: "A → Z",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M3 12h12M3 17h6" />
      </svg>
    ),
  },
  {
    value: "za",
    label: "Z → A",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h6M3 12h12M3 17h18" />
      </svg>
    ),
  },
  {
    value: "price_asc",
    label: "Price: Low to High",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
      </svg>
    ),
  },
  {
    value: "price_desc",
    label: "Price: High to Low",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    ),
  },
];

function SortDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const active = SORT_OPTIONS.find((o) => o.value === value);

  useEffect(() => {
    function onDown(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition whitespace-nowrap
          ${open
            ? "border-brandRed bg-brandRed text-white shadow-md"
            : "border-gray-200 bg-white text-charcoal hover:border-brandRed hover:text-brandRed"
          }`}
      >
        <svg className="w-3.5 h-3.5 opacity-70" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M6 12h12M10 17h4" />
        </svg>
        <span>{active?.label}</span>
        <svg
          className={`w-3 h-3 opacity-60 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] bg-white border border-gray-100 rounded-2xl shadow-xl py-2 w-52 z-50 overflow-hidden">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-4 pt-1 pb-2">
            Sort by
          </p>
          {SORT_OPTIONS.map((opt) => {
            const isActive = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition
                  ${isActive
                    ? "bg-brandRed/8 text-brandRed font-semibold"
                    : "text-charcoal hover:bg-softGrey"
                  }`}
              >
                <span className={isActive ? "text-brandRed" : "text-gray-400"}>
                  {opt.icon}
                </span>
                <span className="flex-1 text-left">{opt.label}</span>
                {isActive && (
                  <svg className="w-3.5 h-3.5 text-brandRed flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
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

function RadioOption({ value, label, current, onChange }) {
  const active = current === value;
  return (
    <button type="button" onClick={() => onChange(value)} className="flex items-center gap-2.5 w-full group">
      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition flex-shrink-0
        ${active ? "border-brandRed" : "border-gray-300 group-hover:border-brandRed"}`}>
        {active && <div className="w-2 h-2 rounded-full bg-brandRed" />}
      </div>
      <span className={`text-sm transition ${active ? "text-charcoal font-semibold" : "text-gray-500 group-hover:text-charcoal"}`}>
        {label}
      </span>
    </button>
  );
}

function FilterDropdown({ label, activeCount, children }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onDown(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const active = open || activeCount > 0;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-semibold transition whitespace-nowrap
          ${active
            ? "border-brandRed bg-brandRed text-white shadow-sm"
            : "border-gray-300 bg-white text-gray-600 hover:border-brandRed hover:text-brandRed"
          }`}
      >
        <span>{label}</span>
        {activeCount > 0 && (
          <span className="bg-white text-brandRed text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
            {activeCount}
          </span>
        )}
        <svg
          className={`w-3 h-3 opacity-70 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+8px)] bg-white border border-gray-100 rounded-2xl shadow-xl py-3 px-4 min-w-[180px] z-50">
          {children}
        </div>
      )}
    </div>
  );
}

export default function CoursesPage() {
  usePageTitle("Courses");
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [enrolledIds, setEnrolledIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [activeCategories, setActiveCategories] = useState(new Set());
  const [priceFilter, setPriceFilter] = useState("all");
  const [enrollFilter, setEnrollFilter] = useState("all");
  const isLoggedIn = !!getUserToken();

  useEffect(() => {
    const enrolledPromise = getUserToken()
      ? getMyCourseIds().catch(() => [])
      : Promise.resolve([]);

    Promise.all([
      getPublishedCourses().catch((err) => { setError(err.message); return []; }),
      enrolledPromise,
    ])
      .then(([list, ids]) => {
        setCourses(Array.isArray(list) ? list : []);
        setEnrolledIds(new Set(Array.isArray(ids) ? ids : []));
      })
      .finally(() => setLoading(false));
  }, []);

  const categories = MEDICAL_SPECIALTIES;

  function toggleCategory(cat) {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  function clearAll() {
    setActiveCategories(new Set());
    setPriceFilter("all");
    setEnrollFilter("all");
  }

  const activeFiltersCount =
    activeCategories.size +
    (priceFilter !== "all" ? 1 : 0) +
    (enrollFilter !== "all" ? 1 : 0);

  const filtered = courses
    .filter((c) => {
      const q = search.toLowerCase();
      const matchesSearch =
        c.courseName?.toLowerCase().includes(q) ||
        c.category?.toLowerCase().includes(q) ||
        c.courseDescription?.toLowerCase().includes(q);
      const matchesCategory = activeCategories.size === 0 ||
        [...activeCategories].some((s) => s.toLowerCase() === c.category?.toLowerCase());
      const price = Number(c.coursePrice) || 0;
      const matchesPrice =
        priceFilter === "all" ||
        (priceFilter === "free" && price === 0) ||
        (priceFilter === "paid" && price > 0);
      const enrolled = enrolledIds.has(String(c._id));
      const matchesEnroll =
        enrollFilter === "all" ||
        (enrollFilter === "enrolled" && enrolled) ||
        (enrollFilter === "new" && !enrolled);
      return matchesSearch && matchesCategory && matchesPrice && matchesEnroll;
    })
    .sort((a, b) => {
      if (sort === "az")         return (a.courseName || "").localeCompare(b.courseName || "");
      if (sort === "za")         return (b.courseName || "").localeCompare(a.courseName || "");
      if (sort === "price_asc")  return (Number(a.coursePrice) || 0) - (Number(b.coursePrice) || 0);
      if (sort === "price_desc") return (Number(b.coursePrice) || 0) - (Number(a.coursePrice) || 0);
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  return (
    <div className="min-h-screen bg-softGrey">
      <UserNavbar links={NAV_LINKS} />

      {/* Page header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <p className="text-brandRed text-xs font-bold uppercase tracking-widest mb-2">Our curriculum</p>
          <h1 className="font-heading font-black text-charcoal mb-3" style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)" }}>
            All courses
          </h1>
          <p className="text-gray-400 text-sm mb-6 max-w-md">
            Browse every published course — no account needed to explore.
          </p>

          {/* Search + sort + filter pills — all one row */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-64">
              <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm text-charcoal placeholder-gray-300 focus:outline-none focus:border-brandRed transition bg-white"
              />
            </div>

            {/* Thin divider */}
            <div className="w-px h-5 bg-gray-200" />

            <SortDropdown value={sort} onChange={setSort} />

            {/* Thin divider */}
            {!loading && !error && <div className="w-px h-5 bg-gray-200" />}

            {/* Filter pills — shown after load */}
            {!loading && !error && (
              <>
                {(
                  <FilterDropdown label="Category" activeCount={activeCategories.size}>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2.5">Category</p>
                    <div className="space-y-2">
                      {categories.map((cat) => {
                        const count = courses.filter((c) => c.category?.toLowerCase() === cat.toLowerCase()).length;
                        const active = activeCategories.has(cat);
                        return (
                          <button key={cat} type="button" onClick={() => toggleCategory(cat)} className="flex items-center gap-2.5 w-full group">
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition flex-shrink-0
                              ${active ? "bg-brandRed border-brandRed" : "border-gray-300 group-hover:border-brandRed"}`}>
                              {active && (
                                <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth={3.5} viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <span className={`text-sm flex-1 text-left transition ${active ? "text-charcoal font-semibold" : "text-gray-500 group-hover:text-charcoal"}`}>{cat}</span>
                            <span className="text-[11px] text-gray-300 tabular-nums">{count}</span>
                          </button>
                        );
                      })}
                    </div>
                  </FilterDropdown>
                )}

                <FilterDropdown label="Price" activeCount={priceFilter !== "all" ? 1 : 0}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2.5">Price</p>
                  <div className="space-y-2">
                    <RadioOption value="all"  label="All"  current={priceFilter} onChange={setPriceFilter} />
                    <RadioOption value="free" label="Free" current={priceFilter} onChange={setPriceFilter} />
                    <RadioOption value="paid" label="Paid" current={priceFilter} onChange={setPriceFilter} />
                  </div>
                </FilterDropdown>

                {isLoggedIn && (
                  <FilterDropdown label="Enrollment" activeCount={enrollFilter !== "all" ? 1 : 0}>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2.5">Enrollment</p>
                    <div className="space-y-2">
                      <RadioOption value="all"      label="All courses"  current={enrollFilter} onChange={setEnrollFilter} />
                      <RadioOption value="enrolled" label="Enrolled"     current={enrollFilter} onChange={setEnrollFilter} />
                      <RadioOption value="new"      label="Not enrolled" current={enrollFilter} onChange={setEnrollFilter} />
                    </div>
                  </FilterDropdown>
                )}

                {activeFiltersCount > 0 && (
                  <button type="button" onClick={clearAll} className="flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-brandRed transition">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Clear {activeFiltersCount}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Course grid */}
      <div className="max-w-6xl mx-auto px-6 py-12">
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

        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-card">
              <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <p className="font-heading font-semibold text-charcoal mb-1">No courses found</p>
            <p className="text-gray-400 text-sm">
              {search || activeFiltersCount > 0 ? "Try adjusting your search or filters." : "Check back soon."}
            </p>
            {activeFiltersCount > 0 && (
              <button type="button" onClick={clearAll} className="mt-3 text-brandRed text-xs font-semibold hover:underline">
                Clear filters
              </button>
            )}
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
