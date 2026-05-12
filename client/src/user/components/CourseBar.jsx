import { useEffect, useState } from "react";
import { getCourseReviews } from "../api/userApi";

/**
 * Strips HTML and converts &nbsp; / &amp; etc back to text — used on cards
 * and anywhere the rich description has to fit in a single line / preview.
 * Works without a DOMParser-allocated document so it's cheap to run on every
 * card in a grid.
 */
export function stripHtmlToText(value) {
  if (!value) return "";
  if (typeof value !== "string") return String(value);
  if (!/<[a-z][\s\S]*>/i.test(value)) return value;
  if (typeof window === "undefined") {
    // SSR fallback — naive tag strip.
    return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }
  const tmp = document.createElement("div");
  tmp.innerHTML = value;
  return (tmp.textContent || tmp.innerText || "").replace(/\s+/g, " ").trim();
}

/**
 * Tiny hook the existing hero / sidebar rows can use to surface the real
 * average rating and review count for a course without re-implementing the
 * fetch each time.
 */
export function useCourseRating(courseId) {
  const [rating, setRating] = useState({ average: 0, count: 0 });
  useEffect(() => {
    if (!courseId) return;
    let cancelled = false;
    getCourseReviews(courseId)
      .then((data) => {
        if (cancelled) return;
        setRating({
          average: Number(data?.average) || 0,
          count: Number(data?.count) || 0,
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [courseId]);
  return rating;
}

/**
 * Header bar shown on top of every course-facing page (detail, learn).
 *
 *  • Category pill + course title on the left.
 *  • Instructors (skips "Unassigned" and empty values).
 *  • Average rating with star count + reviews-count link to the Reviews tab.
 *
 *  Average rating is fetched directly so the bar works on the public detail
 *  page (no enrollment required) and stays in sync with whatever ReviewsTab
 *  shows on the enrolled page.
 *
 *  Props:
 *    course        — the course doc
 *    onShowReviews — optional callback to scroll/jump to the Reviews section
 */
export default function CourseBar({ course, onShowReviews }) {
  const [rating, setRating] = useState({ average: 0, count: 0 });

  useEffect(() => {
    if (!course?._id) return;
    let cancelled = false;
    getCourseReviews(course._id)
      .then((data) => {
        if (cancelled) return;
        setRating({
          average: Number(data?.average) || 0,
          count: Number(data?.count) || 0,
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [course?._id]);

  const instructors = listInstructors(course);
  const hasRating = rating.count > 0;
  const stars = Math.round(rating.average);

  return (
    <div className="bg-white border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {course.category && (
            <span className="bg-red-50 text-brandRed text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md shrink-0">
              {course.category}
            </span>
          )}
          <h2 className="font-heading font-bold text-charcoal text-base truncate">
            {course.courseName}
          </h2>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {instructors.length > 0 && (
            <p className="text-xs text-gray-500 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="font-medium text-charcoal">
                {formatInstructorList(instructors)}
              </span>
            </p>
          )}

          <button
            type="button"
            onClick={onShowReviews}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-softGrey transition cursor-pointer text-left"
            title={hasRating ? `${rating.count} review${rating.count === 1 ? "" : "s"}` : "No reviews yet"}
          >
            <div className="flex items-center gap-0.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <svg
                  key={i}
                  className={`w-3.5 h-3.5 ${i < stars ? "text-yellow-400" : "text-gray-200"}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.446a1 1 0 00-.364 1.118l1.287 3.957c.3.922-.755 1.688-1.54 1.118l-3.366-2.446a1 1 0 00-1.176 0l-3.367 2.446c-.784.57-1.838-.196-1.539-1.118l1.286-3.957a1 1 0 00-.363-1.118L2.07 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.951-.69l1.286-3.957z" />
                </svg>
              ))}
            </div>
            {hasRating ? (
              <span className="text-xs font-semibold text-charcoal">
                {rating.average.toFixed(1)}
                <span className="text-gray-400 font-normal ml-1">
                  ({rating.count})
                </span>
              </span>
            ) : (
              <span className="text-xs text-gray-400">No reviews</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns a deduped list of instructor display names, skipping "Unassigned" and
 * empty values. Handles both the new `instructors[]` array and the legacy
 * single `instructor` string field.
 */
export function listInstructors(course) {
  const names = [];
  const seen = new Set();

  const push = (raw) => {
    if (!raw) return;
    const name = String(raw).trim();
    if (!name) return;
    if (name.toLowerCase() === "unassigned") return;
    if (seen.has(name.toLowerCase())) return;
    seen.add(name.toLowerCase());
    names.push(name);
  };

  if (Array.isArray(course?.instructors)) {
    for (const ins of course.instructors) push(ins?.name);
  }
  if (typeof course?.instructor === "string") push(course.instructor);

  return names;
}

/**
 * "Dr. Smith" · "Dr. Smith & Dr. Jones" · "Dr. Smith, Dr. Jones & Dr. Lee"
 */
export function formatInstructorList(names) {
  if (!Array.isArray(names) || names.length === 0) return "";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} & ${names[1]}`;
  const head = names.slice(0, -1).join(", ");
  const last = names[names.length - 1];
  return `${head} & ${last}`;
}
