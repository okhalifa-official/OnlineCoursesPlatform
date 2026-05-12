import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  enrollInCourse,
  getPublishedCourseById,
  getUserToken,
} from "../api/userApi";
import UserNavbar from "../components/UserNavbar";
import { listInstructors, useCourseRating } from "../components/CourseBar";
import RichText from "../components/RichText";

const NAV_LINKS = [
  { label: "Home",    to: "/",         section: null      },
  { label: "Courses", to: "/courses",  section: null      },
  { label: "Why Us",  to: "/#why-us",  section: "why-us"  },
];

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return parts.map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-softGrey transition"
      >
        <span className="text-sm font-semibold text-charcoal">{question || "Untitled question"}</span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && answer && (
        <RichText
          value={answer}
          className="px-5 pb-4 text-sm text-gray-500 leading-relaxed border-t border-gray-100 pt-3"
        />
      )}
    </div>
  );
}

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [enrolling, setEnrolling] = useState(false);
  const [playingPreview, setPlayingPreview] = useState(false);

  useEffect(() => {
    setLoading(true);
    getPublishedCourseById(id)
      .then(setCourse)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  // Real review average — feeds the stars pill in the hero. Called above the
  // early returns so the hook order stays stable across renders.
  const rating = useCourseRating(id);
  const ratingStars = Math.round(rating.average);

  async function handleEnroll() {
    if (!getUserToken()) {
      navigate("/login");
      return;
    }

    // Paid courses: payment isn't wired up yet — just inform the user.
    if (course && Number(course.coursePrice) > 0) {
      alert("Payment integration coming soon.");
      return;
    }

    try {
      setEnrolling(true);
      await enrollInCourse(id);
      // User asked for: free course → enroll then go to "My Courses".
      navigate("/home");
    } catch (err) {
      alert(err.message);
    } finally {
      setEnrolling(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-softGrey">
        <UserNavbar links={NAV_LINKS} />
        <div className="max-w-6xl mx-auto px-6 py-16 animate-pulse">
          <div className="h-3 w-48 bg-gray-200 rounded mb-6" />
          <div className="h-6 w-24 bg-gray-200 rounded-full mb-4" />
          <div className="h-10 w-2/3 bg-gray-200 rounded mb-3" />
          <div className="h-4 w-1/2 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-softGrey">
        <UserNavbar links={NAV_LINKS} />
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-brandRed text-sm">
            {error || "Course not found."}
          </div>
        </div>
      </div>
    );
  }

  // Build the instructor list using the shared filter (skips "Unassigned"
  // and empty entries, dedupes case-insensitively).
  const instructorNames = listInstructors(course);
  const instructors = instructorNames.map((name) => ({ name }));
  // Joined label for the meta row: "Dr. Smith" or "Dr. Smith & Dr. Jones".
  const primaryInstructor =
    instructorNames.length <= 1
      ? instructorNames[0] || ""
      : instructorNames.join(" & ");
  const isFree = !course.coursePrice || Number(course.coursePrice) === 0;

  const moduleCount = Array.isArray(course.modules) ? course.modules.length : 0;
  const lectureCount = Array.isArray(course.modules)
    ? course.modules.reduce((sum, m) => sum + (m.lessons?.length || 0), 0)
    : 0;

  return (
    <div className="min-h-screen bg-softGrey">
      <UserNavbar links={NAV_LINKS} />

      {/* ─── Hero header ─── */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-10">
          {/* Breadcrumb */}
          <nav className="text-xs text-gray-400 mb-6 flex items-center gap-1.5 flex-wrap">
            <Link to="/" className="hover:text-brandRed transition">Home</Link>
            <span>/</span>
            <Link to="/courses" className="hover:text-brandRed transition">My Courses</Link>
            <span>/</span>
            <span className="text-charcoal font-medium truncate max-w-[200px]">{course.courseName}</span>
          </nav>

          {/* Category pill */}
          <span className="inline-block bg-red-50 text-brandRed text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-4">
            {course.category || "General"}
          </span>

          {/* Title */}
          <h1
            className="font-heading font-black text-charcoal mb-3 leading-tight"
            style={{ fontSize: "clamp(2rem, 4vw, 3.25rem)" }}
          >
            {course.courseName}
          </h1>

          {/* Description (rich-text aware) */}
          {course.courseDescription && (
            <RichText
              value={course.courseDescription}
              className="text-gray-500 text-base max-w-2xl mb-6 leading-relaxed"
            />
          )}

          {/* Rating + instructor + counts row */}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <div className="inline-flex items-center gap-2 bg-softGrey rounded-lg px-3 py-2">
              <div className="flex items-center gap-0.5">
                {[0, 1, 2, 3, 4].map((i) => (
                  <svg
                    key={i}
                    className={`w-3.5 h-3.5 ${i < ratingStars ? "text-yellow-400" : "text-gray-300"}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.446a1 1 0 00-.364 1.118l1.287 3.957c.3.922-.755 1.688-1.54 1.118l-3.366-2.446a1 1 0 00-1.176 0l-3.367 2.446c-.784.57-1.838-.196-1.539-1.118l1.286-3.957a1 1 0 00-.363-1.118L2.07 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.951-.69l1.286-3.957z" />
                  </svg>
                ))}
              </div>
              <span className="text-xs font-semibold text-charcoal">
                {rating.count > 0
                  ? `${rating.average.toFixed(1)} (${rating.count})`
                  : "No reviews yet"}
              </span>
            </div>

            {primaryInstructor && (
              <div className="inline-flex items-center gap-2 bg-softGrey rounded-lg px-3 py-2">
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-xs font-semibold text-charcoal">{primaryInstructor}</span>
              </div>
            )}

            <div className="inline-flex items-center gap-2 bg-softGrey rounded-lg px-3 py-2">
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span className="text-xs font-semibold text-charcoal">
                {moduleCount} module{moduleCount === 1 ? "" : "s"}
              </span>
            </div>

            <div className="inline-flex items-center gap-2 bg-softGrey rounded-lg px-3 py-2">
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span className="text-xs font-semibold text-charcoal">
                {lectureCount} lecture{lectureCount === 1 ? "" : "s"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Body: 2 columns ─── */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column: instructor, modules, faqs */}
          <div className="lg:col-span-2 space-y-10">
            {/* Instructors */}
            {instructors.length > 0 && (
              <div>
                <h2 className="font-heading font-bold text-charcoal text-xl mb-4">
                  {instructors.length > 1 ? "Instructors" : "Instructor"}
                </h2>
                <div className="space-y-3">
                  {instructors.map((ins, i) => (
                    <div
                      key={i}
                      className="bg-white rounded-2xl shadow-card border border-gray-100 px-5 py-4 flex items-center gap-4"
                    >
                      <div className="w-12 h-12 rounded-full bg-brandRed flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-white">
                          {getInitials(ins.name)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-charcoal">{ins.name}</p>
                        <p className="text-xs text-gray-400">Course Instructor</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Curriculum */}
            {Array.isArray(course.modules) && course.modules.length > 0 && (
              <div>
                <h2 className="font-heading font-bold text-charcoal text-xl mb-4">
                  Curriculum
                </h2>
                <div className="space-y-3">
                  {course.modules.map((module, mi) => (
                    <div
                      key={mi}
                      className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden"
                    >
                      <div className="px-5 py-4 flex items-center gap-3 bg-softGrey/50 border-b border-gray-100">
                        <span className="text-xs font-black bg-brandRed text-white w-6 h-6 flex items-center justify-center rounded">
                          {String(mi + 1).padStart(2, "0")}
                        </span>
                        <span className="text-sm font-bold text-charcoal">{module.title}</span>
                        <span className="ml-auto text-xs text-gray-400">
                          {(module.lessons || []).length} lecture
                          {(module.lessons || []).length === 1 ? "" : "s"}
                        </span>
                      </div>

                      {(module.lessons || []).length > 0 && (
                        <div className="divide-y divide-gray-100">
                          {module.lessons.map((lesson, li) => (
                            <div
                              key={li}
                              className="px-5 py-3 flex items-center gap-3"
                            >
                              <span
                                className={`material-symbols-outlined text-base ${
                                  lesson.type === "pdf" ? "text-brandRed" : "text-emerald-600"
                                }`}
                              >
                                {lesson.type === "pdf" ? "description" : "play_circle"}
                              </span>
                              <span className="text-sm text-charcoal flex-1">{lesson.title}</span>
                              {lesson.duration && (
                                <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">
                                  {lesson.duration}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* FAQs */}
            {Array.isArray(course.faqs) && course.faqs.length > 0 && (
              <div>
                <h2 className="font-heading font-bold text-charcoal text-xl mb-4">
                  Frequently Asked Questions
                </h2>
                <div className="space-y-3">
                  {course.faqs.map((faq, i) => (
                    <FaqItem key={i} question={faq.question} answer={faq.answer} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right column: pricing card */}
          <aside className="lg:col-span-1">
            <div className="sticky top-20 bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
              {/* Preview image / video poster — clicking the play overlay swaps
                  in an inline player for the uploaded file or a URL embed. */}
              <PreviewMedia
                course={course}
                playing={playingPreview}
                onPlay={() => setPlayingPreview(true)}
              />

              <div className="p-6">
                <p className={`font-heading font-black text-3xl mb-4 ${isFree ? "text-emerald-600" : "text-charcoal"}`}>
                  {isFree ? "Free" : `$${course.coursePrice}`}
                </p>

                <button
                  type="button"
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="w-full bg-brandRed text-white font-bold rounded-xl py-3 hover:bg-red-700 transition flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {enrolling ? "Enrolling..." : isFree ? "Enroll Now" : "Buy Now"}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </button>

                {!isFree && (
                  <p className="text-[11px] text-gray-400 text-center mt-3">
                    Payment integration coming soon.
                  </p>
                )}

                <div className="mt-6 pt-5 border-t border-gray-100">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
                    This course includes
                  </p>
                  <ul className="space-y-2.5 text-sm text-charcoal">
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-brandRed" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Full lifetime access
                    </li>
                    {moduleCount > 0 && (
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-brandRed" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                        {moduleCount} module{moduleCount === 1 ? "" : "s"}
                      </li>
                    )}
                    {lectureCount > 0 && (
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-brandRed" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        {lectureCount} lecture{lectureCount === 1 ? "" : "s"}
                      </li>
                    )}
                    {Array.isArray(course.courseFilesNames) && course.courseFilesNames.length > 0 && (
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-brandRed" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {course.courseFilesNames.length} downloadable file
                        {course.courseFilesNames.length === 1 ? "" : "s"}
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}

/**
 * Detects YouTube / Vimeo URLs and returns an embeddable URL — used when the
 * admin pasted a hosted URL instead of uploading the file directly.
 */
function getEmbedUrl(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com") || u.hostname.includes("youtu.be")) {
      const id = u.hostname.includes("youtu.be")
        ? u.pathname.slice(1)
        : u.searchParams.get("v") || u.pathname.split("/").pop();
      return `https://www.youtube.com/embed/${id}?autoplay=1`;
    }
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean).pop();
      return `https://player.vimeo.com/video/${id}?autoplay=1`;
    }
  } catch {
    return null;
  }
  return null;
}

function PreviewMedia({ course, playing, onPlay }) {
  const embedUrl = course.previewVideoURL ? getEmbedUrl(course.previewVideoURL) : null;
  const directVideoUrl = !embedUrl && course.previewVideoURL ? course.previewVideoURL : null;
  const uploadedVideoFile = course.previewVideoFile || "";
  const hasUploadedVideo = Boolean(uploadedVideoFile);
  const hasAnyVideo = hasUploadedVideo || embedUrl || directVideoUrl;

  function handlePlay() {
    onPlay?.();
  }

  if (playing && hasUploadedVideo) {
    return (
      <div className="relative aspect-video bg-black">
        <video
          src={uploadedVideoFile}
          controls
          autoPlay
          className="w-full h-full"
        />
      </div>
    );
  }
  if (playing && embedUrl) {
    return (
      <div className="relative aspect-video bg-black">
        <iframe
          src={embedUrl}
          title="Course preview"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
    );
  }
  if (playing && directVideoUrl) {
    return (
      <div className="relative aspect-video bg-black">
        <video src={directVideoUrl} controls autoPlay className="w-full h-full" />
      </div>
    );
  }

  return (
    <div className="relative aspect-video bg-softGrey">
      {course.previewImage ? (
        <img
          src={course.previewImage}
          alt={course.courseName}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <span className="material-symbols-outlined text-gray-300 text-5xl">
            image
          </span>
        </div>
      )}
      {hasAnyVideo && (
        <button
          type="button"
          onClick={handlePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition"
        >
          <span className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-lg">
            <span className="material-symbols-outlined text-brandRed text-3xl">
              play_arrow
            </span>
          </span>
        </button>
      )}
    </div>
  );
}
