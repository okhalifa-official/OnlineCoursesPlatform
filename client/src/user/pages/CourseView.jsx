import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import StudentShell, { StudentTopBar } from "../components/StudentShell";
import SecurePdfViewer from "../components/SecurePdfViewer";
import { useCourseRating, listInstructors, formatInstructorList } from "../components/CourseBar";
import RichText from "../components/RichText";
import {
  deleteCourseReview,
  getCourseEnrollment,
  getCourseReviews,
  getEnrolledCourse,
  getUserInfo,
  getUserToken,
  postCourseReview,
} from "../api/userApi";

const TABS = ["Lectures", "Discussion", "Material", "Instructor", "Reviews"];

const CATEGORY_GRADIENTS = {
  pocus:      "from-purple-700 to-purple-900",
  echo:       "from-rose-700 to-rose-900",
  cardiology: "from-blue-700 to-blue-900",
  radiology:  "from-emerald-700 to-emerald-900",
  emergency:  "from-amber-700 to-amber-900",
  default:    "from-slate-700 to-slate-900",
};

function categoryGradient(category) {
  if (!category) return CATEGORY_GRADIENTS.default;
  const key = Object.keys(CATEGORY_GRADIENTS).find((k) =>
    category.toLowerCase().includes(k)
  );
  return CATEGORY_GRADIENTS[key] || CATEGORY_GRADIENTS.default;
}

function progressKey(courseId) {
  return `course-progress:${courseId}`;
}
function loadProgress(courseId) {
  try {
    return JSON.parse(localStorage.getItem(progressKey(courseId))) || {};
  } catch {
    return {};
  }
}
function lessonId(mi, li) {
  return `${mi}-${li}`;
}

export default function CourseView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("Lectures");
  const [progress, setProgress] = useState({});
  const [openMaterial, setOpenMaterial] = useState(null);

  useEffect(() => {
    if (!getUserToken()) {
      navigate("/login");
      return;
    }
    setLoading(true);
    Promise.all([
      getEnrolledCourse(id),
      getCourseEnrollment(id).catch(() => null),
    ])
      .then(([data, enrollmentData]) => {
        setCourse(data);
        setEnrollment(enrollmentData);
        setProgress(loadProgress(id));
      })
      .catch((err) => {
        if (err.message === "Not enrolled") {
          navigate(`/courses/${id}`, { replace: true });
        } else {
          setError(err.message);
        }
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  // Compute resume target & flat counts. useMemo so it doesn't run on every render.
  const computed = useMemo(() => {
    if (!course)
      return { modules: [], lectureCount: 0, resume: null, resumeNumber: 1 };

    const modules = Array.isArray(course.modules) ? course.modules : [];
    let lectureCount = 0;
    let counter = 0;
    let resume = null;
    let resumeNumber = 1;
    let foundUnfinished = false;

    // PDF lessons are surfaced as material (no completion tracking, no
    // resume target). Only video lessons count toward lectureCount.
    for (let mi = 0; mi < modules.length; mi++) {
      const lessons = modules[mi].lessons || [];
      for (let li = 0; li < lessons.length; li++) {
        if (lessons[li].type === "pdf") continue;
        lectureCount += 1;
        counter += 1;
        if (!progress[lessonId(mi, li)] && !foundUnfinished) {
          resume = { mi, li };
          resumeNumber = counter;
          foundUnfinished = true;
        }
      }
    }
    if (!foundUnfinished && lectureCount > 0) {
      // Find the first video lesson (skipping PDFs) for the resume tile.
      outer: for (let mi = 0; mi < modules.length; mi++) {
        const lessons = modules[mi].lessons || [];
        for (let li = 0; li < lessons.length; li++) {
          if (lessons[li].type !== "pdf") {
            resume = { mi, li };
            resumeNumber = 1;
            break outer;
          }
        }
      }
    }
    return { modules, lectureCount, resume, resumeNumber };
  }, [course, progress]);

  // Real review average — feeds the stars pill in the hero below. Kept above
  // any early return so the hook order stays stable.
  const rating = useCourseRating(id);
  const ratingStars = Math.round(rating.average);

  if (loading) {
    return (
      <StudentShell activeLink="My Courses">
        <div className="px-8 py-12 animate-pulse">
          <div className="h-4 w-48 bg-gray-200 rounded mb-6" />
          <div className="h-72 bg-gray-200 rounded-3xl" />
        </div>
      </StudentShell>
    );
  }

  if (error || !course) {
    return (
      <StudentShell activeLink="My Courses">
        <div className="px-8 py-12">
          <p className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-brandRed text-sm">
            {error || "Course not found."}
          </p>
        </div>
      </StudentShell>
    );
  }

  const { modules, lectureCount, resume, resumeNumber } = computed;
  // Only count video lessons toward completion — PDF lessons are material
  // and don't have a "completed" state.
  const completedCount = modules.reduce((sum, m, mi) => {
    return sum + (m.lessons || []).reduce((s, lesson, li) => {
      if (lesson.type === "pdf") return s;
      return s + (progress[lessonId(mi, li)] ? 1 : 0);
    }, 0);
  }, 0);
  const percent = lectureCount === 0 ? 0 : Math.round((completedCount / lectureCount) * 100);
  const exam = course.exam;

  const breadcrumb = (
    <p>
      <Link to="/my-courses" className="hover:text-brandRed transition">
        My Courses
      </Link>
      <span className="mx-1.5">/</span>
      <span className="text-charcoal font-medium">{course.courseName}</span>
    </p>
  );

  const gradientClass = categoryGradient(course.category);

  return (
    <StudentShell activeLink="My Courses">
      <StudentTopBar breadcrumb={breadcrumb} />

      <div className="px-8 pb-12">
        {/* ─── Hero ─── Clean white card with text on the left and a small
            preview-image thumbnail (acts as the play / resume tile) on the
            right. Preview image is no longer used as a giant background. */}
        <div className="bg-white rounded-3xl shadow-card border border-gray-100 overflow-hidden mb-6">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-6 p-6 md:p-8">
            {/* Left: meta + title + stats */}
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span className={`inline-block bg-gradient-to-br ${gradientClass} text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-md`}>
                  {course.category || "Course"}
                </span>
                {exam?.enabled && (
                  <span className="bg-brandRed/10 text-brandRed text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-md">
                    Exam included
                  </span>
                )}
              </div>

              <h1
                className="font-heading font-black text-charcoal mb-3 leading-tight"
                style={{ fontSize: "clamp(1.5rem, 2.5vw, 2.25rem)" }}
              >
                {course.courseName}
              </h1>

              {course.courseDescription && (
                <RichText
                  value={course.courseDescription}
                  className="text-gray-500 text-sm leading-relaxed line-clamp-3 mb-5 max-w-xl"
                />
              )}

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-gray-500">
                <button
                  type="button"
                  onClick={() => setActiveTab("Reviews")}
                  className="inline-flex items-center gap-1.5 hover:text-charcoal transition cursor-pointer"
                  title="Open the Reviews tab"
                >
                  <div className="flex items-center gap-0.5">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <svg
                        key={i}
                        className={`w-3.5 h-3.5 ${i < ratingStars ? "text-yellow-400" : "text-gray-200"}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.446a1 1 0 00-.364 1.118l1.287 3.957c.3.922-.755 1.688-1.54 1.118l-3.366-2.446a1 1 0 00-1.176 0l-3.367 2.446c-.784.57-1.838-.196-1.539-1.118l1.286-3.957a1 1 0 00-.363-1.118L2.07 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.951-.69l1.286-3.957z" />
                      </svg>
                    ))}
                  </div>
                  <span className="font-semibold text-charcoal">
                    {rating.count > 0
                      ? `${rating.average.toFixed(1)} (${rating.count})`
                      : "No reviews yet"}
                  </span>
                </button>
                {formatInstructorList(listInstructors(course)) && (
                  <>
                    <span className="inline-flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="font-semibold text-charcoal">
                        {formatInstructorList(listInstructors(course))}
                      </span>
                    </span>
                    <span>·</span>
                  </>
                )}
                <span>{modules.length} module{modules.length === 1 ? "" : "s"}</span>
                <span>·</span>
                <span>{lectureCount} lecture{lectureCount === 1 ? "" : "s"}</span>
                {course.activeStudents > 0 && (
                  <>
                    <span>·</span>
                    <span>{course.activeStudents} enrolled</span>
                  </>
                )}
              </div>
            </div>

            {/* Right: resume thumbnail tile — preview image is the poster */}
            {lectureCount > 0 && resume ? (
              <button
                type="button"
                onClick={() =>
                  navigate(`/learn/${id}/lecture/${resume.mi}/${resume.li}`)
                }
                className="group relative aspect-video md:aspect-auto md:h-full rounded-2xl overflow-hidden shadow-md border border-gray-100 text-left"
              >
                {course.previewImage ? (
                  <img
                    src={course.previewImage}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass}`} />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10 group-hover:from-black/85 transition" />

                {/* Play icon */}
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="w-14 h-14 rounded-full bg-brandRed text-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </span>
                </span>

                {/* Footer text */}
                <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/70 mb-0.5">
                    {completedCount === 0 ? "Start learning" : "Resume"}
                  </p>
                  <p className="font-heading font-bold text-sm">
                    Lecture {resumeNumber}
                  </p>
                </div>
              </button>
            ) : (
              <div className="aspect-video md:aspect-auto md:h-full rounded-2xl bg-softGrey flex items-center justify-center text-xs text-gray-400">
                No lectures yet
              </div>
            )}
          </div>
        </div>

        {/* ─── Two-column body ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* LEFT */}
          <div>
            {/* Tabs */}
            <div className="border-b border-gray-200 flex items-center gap-6 overflow-x-auto mb-5">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 text-sm font-semibold transition relative shrink-0 ${
                    activeTab === tab
                      ? "text-brandRed"
                      : "text-gray-400 hover:text-charcoal"
                  }`}
                >
                  {tab}
                  {activeTab === tab && (
                    <span className="absolute -bottom-px left-0 right-0 h-0.5 bg-brandRed rounded-full" />
                  )}
                </button>
              ))}
            </div>

            {activeTab === "Lectures" && (
              <LessonsTab
                modules={modules}
                progress={progress}
                exam={exam}
                enrollment={enrollment}
                lectureCount={lectureCount}
                completedCount={completedCount}
                onOpenLecture={(mi, li) =>
                  navigate(`/learn/${id}/lecture/${mi}/${li}`)
                }
                onOpenPdfLesson={(lesson) => {
                  if (!lesson?.pdfFile) {
                    alert(
                      "This PDF lecture has no file attached. Open Edit Course → Curriculum and upload the PDF."
                    );
                    return;
                  }
                  setOpenMaterial({
                    name: lesson.pdfName || lesson.title || "Lecture PDF",
                    mimeType: "application/pdf",
                    data: lesson.pdfFile,
                    sizeKB: lesson.pdfSizeKB,
                  });
                }}
                onAttemptExam={() => navigate(`/learn/${id}/exam`)}
              />
            )}

            {activeTab === "Discussion" && (
              <PlaceholderCard text="Discussion thread is coming soon." />
            )}

            {activeTab === "Material" && (
              <ResourcesTab
                course={course}
                onOpen={(m) => {
                  if (!m?.data) {
                    alert(
                      "This material has no file data. Open Edit Course → Material and re-upload the PDF, then save."
                    );
                    return;
                  }
                  setOpenMaterial(m);
                }}
              />
            )}

            {activeTab === "Instructor" && (
              <FacultyTab instructors={course.instructors || []} />
            )}

            {activeTab === "Reviews" && (
              <ReviewsTab courseId={id} enrollment={enrollment} />
            )}
          </div>

          {/* RIGHT — sidebar */}
          <aside className="space-y-4">
            {/* Progress card */}
            <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
                Your progress
              </p>
              <div className="flex items-center gap-4 mb-4">
                <ProgressRing percent={percent} />
                <div>
                  <p className="font-heading font-bold text-charcoal text-base">
                    {percent}% complete
                  </p>
                  <p className="text-xs text-gray-400">
                    {completedCount} of {lectureCount} lecture
                    {lectureCount === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
              <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full bg-brandRed transition-all"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>

            {/* Discussion */}
            <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-heading font-bold text-charcoal text-sm">
                  Course discussion
                </h3>
                <span className="bg-softGrey text-gray-500 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded">
                  0 posts
                </span>
              </div>
              <textarea
                rows="3"
                placeholder="Ask a question or share a case…"
                className="w-full bg-softGrey rounded-xl border border-transparent focus:border-brandRed focus:bg-white transition px-3 py-2.5 text-sm resize-none outline-none"
              />
              <p className="text-[10px] text-gray-400 mt-2">
                Posts are coming soon.
              </p>
            </div>

            {/* Course meta */}
            <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-5">
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
                {modules.length > 0 && (
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-brandRed" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                    {modules.length} module{modules.length === 1 ? "" : "s"}
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
                {exam?.enabled && (
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-brandRed" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    Final exam ({exam.questions?.length || 0} questions)
                  </li>
                )}
              </ul>
            </div>
          </aside>
        </div>
      </div>

      {openMaterial && (
        <SecurePdfViewer
          material={openMaterial}
          onClose={() => setOpenMaterial(null)}
        />
      )}
    </StudentShell>
  );
}

function ProgressRing({ percent }) {
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  return (
    <div className="relative w-14 h-14 shrink-0">
      <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={radius} stroke="#F2F2F2" strokeWidth="5" fill="none" />
        <circle
          cx="28"
          cy="28"
          r={radius}
          stroke="#D62828"
          strokeWidth="5"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-300"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-charcoal">
        {percent}%
      </span>
    </div>
  );
}

function LessonsTab({
  modules,
  progress,
  exam,
  enrollment,
  lectureCount,
  completedCount,
  onOpenLecture,
  onOpenPdfLesson,
  onAttemptExam,
}) {
  if (modules.length === 0 && !exam?.enabled) {
    return <PlaceholderCard text="No lectures available yet." />;
  }
  return (
    <div className="space-y-4">
      {modules.map((module, mi) => {
        const lessons = module.lessons || [];
        // Module progress is over video lessons only — PDFs are material.
        const videoLessons = lessons.filter((l) => l.type !== "pdf");
        const completed = lessons.filter(
          (l, li) => l.type !== "pdf" && progress[lessonId(mi, li)]
        ).length;
        const modulePercent =
          videoLessons.length === 0
            ? 0
            : Math.round((completed / videoLessons.length) * 100);

        return (
          <details
            key={mi}
            open={mi === 0}
            className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden group"
          >
            <summary className="px-5 py-4 flex items-center gap-4 bg-softGrey/40 border-b border-gray-100 cursor-pointer list-none">
              <span className="w-8 h-8 rounded-lg bg-brandRed/10 text-brandRed flex items-center justify-center text-xs font-black shrink-0">
                {String(mi + 1).padStart(2, "0")}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-charcoal truncate">
                  {module.title || `Module ${mi + 1}`}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {completed} of {videoLessons.length} complete · {modulePercent}%
                </p>
              </div>
              <div className="hidden sm:block w-28 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                <div
                  className="h-full bg-brandRed transition-all"
                  style={{ width: `${modulePercent}%` }}
                />
              </div>
              <svg
                className="w-4 h-4 text-gray-300 transition-transform group-open:rotate-180"
                fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </summary>

            <div className="divide-y divide-gray-100">
              {lessons.length === 0 && (
                <p className="px-5 py-4 text-sm text-gray-400">
                  No lectures in this module yet.
                </p>
              )}
              {lessons.map((lesson, li) => {
                const isPdf = lesson.type === "pdf";
                const done = !isPdf && !!progress[lessonId(mi, li)];
                return (
                  <button
                    key={li}
                    type="button"
                    onClick={() =>
                      isPdf ? onOpenPdfLesson?.(lesson) : onOpenLecture(mi, li)
                    }
                    className="w-full px-5 py-3.5 flex items-center gap-4 hover:bg-softGrey/50 transition text-left"
                  >
                    {isPdf ? (
                      // PDF lessons are material — show the material icon
                      // and skip the completion circle entirely.
                      <span className="w-7 h-7 rounded-lg bg-brandRed/10 text-brandRed flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-base">
                          picture_as_pdf
                        </span>
                      </span>
                    ) : (
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                          done
                            ? "bg-emerald-500 text-white"
                            : "border-2 border-gray-200 text-gray-300"
                        }`}
                      >
                        {done ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        )}
                      </span>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-charcoal truncate">
                        {li + 1}. {lesson.title}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5 inline-flex items-center gap-2">
                        <span className="capitalize">{lesson.type || "video"}</span>
                        {lesson.duration && (
                          <>
                            <span>·</span>
                            <span>{lesson.duration}</span>
                          </>
                        )}
                      </p>
                    </div>
                    <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                );
              })}
            </div>
          </details>
        );
      })}

      {exam?.enabled && (
        <ExamCard
          exam={exam}
          enrollment={enrollment}
          lectureCount={lectureCount}
          completedCount={completedCount}
          onAttempt={onAttemptExam}
        />
      )}
    </div>
  );
}

function ExamCard({ exam, enrollment, lectureCount, completedCount, onAttempt }) {
  const navigate = useNavigate();
  const params = useParams();

  // A course with zero lectures is treated as "complete" so the exam is open
  // immediately — useful for exam-only courses or assessments authored before
  // any lecture is published.
  const courseComplete =
    lectureCount === 0 || completedCount >= lectureCount;

  const maxAttempts = Math.max(1, Number(exam.attempts) || 1);
  const attemptsUsed = enrollment?.examAttemptsUsed || 0;
  const attemptsLeft = Math.max(0, maxAttempts - attemptsUsed);

  // Only allow when the course is fully completed AND the student has attempts.
  const hasQuestions = (exam.questions?.length || 0) > 0;
  const blocked = !courseComplete || attemptsLeft === 0 || !hasQuestions;

  // Decide whether the answers-review entry point should appear here. Mirrors
  // the gate used inside ExamView so refresh-resilient access stays in sync.
  const reviewMode = exam.reviewMode || "immediately";
  let reviewState = "hidden";
  let unlockAt = null;
  if (attemptsUsed > 0 && enrollment?.examLastReason !== "disqualified") {
    if (reviewMode === "immediately") {
      reviewState = "open";
    } else if (reviewMode === "after_date" && exam.reviewOpensAt) {
      unlockAt = new Date(exam.reviewOpensAt);
      reviewState = Date.now() >= unlockAt.getTime() ? "open" : "locked";
    }
  }

  // Score is held back until the review unlocks. Disqualified runs still
  // show 0 immediately so the student understands what happened.
  const scoreLocked =
    attemptsUsed > 0 &&
    reviewMode === "after_date" &&
    !!exam.reviewOpensAt &&
    Date.now() < new Date(exam.reviewOpensAt).getTime() &&
    enrollment?.examLastReason !== "disqualified";

  let helpText;
  if (!hasQuestions) {
    helpText = "Exam isn't ready yet — no questions added by the instructor.";
  } else if (!courseComplete) {
    helpText = `Complete every lecture to unlock the exam (${completedCount}/${lectureCount} done).`;
  } else if (attemptsLeft === 0) {
    helpText = "You've used all attempts for this exam.";
  } else {
    helpText = `You have ${attemptsLeft} attempt${attemptsLeft === 1 ? "" : "s"} left out of ${maxAttempts}.`;
  }

  // Result of the most recent attempt — only shown after at least one submission.
  const hasResult = attemptsUsed > 0 && enrollment;
  const lastScore = enrollment?.examLastScore ?? 0;
  const bestScore = enrollment?.examBestScore ?? 0;
  const passingScore = Number(exam.passingScore) || 0;
  const lastReason = enrollment?.examLastReason || "submitted";
  const lastPassed = lastReason !== "disqualified" && lastScore >= passingScore;

  let resultLabel;
  if (lastReason === "disqualified") resultLabel = "Disqualified";
  else if (lastReason === "timeout") resultLabel = lastPassed ? "Passed (time up)" : "Time ran out";
  else resultLabel = lastPassed ? "Passed" : "Not passed";

  const lastTakenAt = enrollment?.examLastTakenAt
    ? new Date(enrollment.examLastTakenAt)
    : null;

  return (
    <div className="bg-white rounded-2xl shadow-card border-2 border-brandRed/30 overflow-hidden">
      <div className="px-5 py-5">
        <div className="flex items-start gap-4 mb-4">
          <span className="w-10 h-10 rounded-lg bg-brandRed text-white flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-charcoal">Final Exam</p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {(exam.questions?.length || 0)} question
              {(exam.questions?.length || 0) === 1 ? "" : "s"} ·{" "}
              {exam.durationMinutes} min · pass {exam.passingScore}% ·{" "}
              {maxAttempts} attempt{maxAttempts === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        {/* Submitted but score is held back until the review window opens. */}
        {hasResult && scoreLocked && (
          <div className="rounded-xl border border-gray-200 bg-white p-4 mb-4 flex items-start gap-3">
            <span className="material-symbols-outlined text-charcoal mt-0.5">
              lock_clock
            </span>
            <div className="flex-1">
              <p className="text-sm font-bold text-charcoal">
                Submission received — results pending
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Your score and answers will unlock on{" "}
                <span className="font-semibold text-charcoal">
                  {unlockAt?.toLocaleString()}
                </span>
                .
              </p>
            </div>
          </div>
        )}

        {/* Last attempt result — only after the student has actually taken it
            AND the score is unlocked (or there's no scheduled lock at all). */}
        {hasResult && !scoreLocked && (
          <div
            className={`rounded-xl border p-4 mb-4 ${
              lastPassed
                ? "bg-emerald-50 border-emerald-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">
                  Last attempt result
                </p>
                <div className="flex items-baseline gap-2">
                  <span
                    className={`font-heading font-black text-3xl ${
                      lastPassed ? "text-emerald-700" : "text-brandRed"
                    }`}
                  >
                    {lastScore}%
                  </span>
                  <span
                    className={`text-xs font-bold uppercase tracking-widest ${
                      lastPassed ? "text-emerald-700" : "text-brandRed"
                    }`}
                  >
                    {resultLabel}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  Pass mark {passingScore}%
                  {bestScore !== lastScore && (
                    <> · best so far {bestScore}%</>
                  )}
                  {lastTakenAt && (
                    <> · {lastTakenAt.toLocaleDateString()}</>
                  )}
                </p>
              </div>

              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                  lastPassed
                    ? "bg-emerald-500 text-white"
                    : "bg-brandRed text-white"
                }`}
              >
                {lastPassed ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
            </div>
          </div>
        )}

        <p className="text-xs text-gray-500 mb-4">{helpText}</p>

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={onAttempt}
            disabled={blocked}
            className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition ${
              blocked
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-brandRed hover:bg-red-700 text-white shadow-lg shadow-brandRed/20"
            }`}
          >
            {blocked ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                {hasResult && lastPassed ? "Exam complete" : "Locked"}
              </>
            ) : (
              <>
                {hasResult ? "Try again" : "Attempt Exam"}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </>
            )}
          </button>

          {reviewState === "open" && (
            <button
              type="button"
              onClick={() => navigate(`/learn/${params.id}/exam/review`)}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-white border border-gray-200 text-charcoal hover:bg-softGrey transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Review answers
            </button>
          )}

          {reviewState === "locked" && unlockAt && (
            <p className="text-[11px] text-gray-500 self-center">
              Review opens on {unlockAt.toLocaleString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function ResourcesTab({ course, onOpen }) {
  const materials = Array.isArray(course.materials) ? course.materials : [];

  if (materials.length === 0) {
    return <PlaceholderCard text="No additional material for this course." />;
  }

  return (
    <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-3 space-y-1">
      {materials.map((m, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onOpen?.(m)}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-brandRed/5 active:bg-brandRed/10 transition text-left cursor-pointer"
        >
          <span className="w-10 h-10 rounded-lg bg-brandRed/10 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-brandRed">
              picture_as_pdf
            </span>
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-charcoal truncate">
              {m.name || "Document"}
            </p>
            <p className="text-[11px] text-gray-400">
              {`${m.sizeKB ? `${m.sizeKB} KB · ` : ""}Click to open in secure viewer`}
            </p>
          </div>
          <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      ))}
    </div>
  );
}

function FacultyTab({ instructors }) {
  if (instructors.length === 0) {
    return <PlaceholderCard text="No instructor information yet." />;
  }
  return (
    <div className="space-y-3">
      {instructors.map((ins, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl shadow-card border border-gray-100 px-5 py-4 flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-full bg-brandRed flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-white">
              {(ins.name || "?")
                .split(/\s+/)
                .map((p) => p[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold text-charcoal">{ins.name}</p>
            <p className="text-xs text-gray-400">Course Instructor</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function PlaceholderCard({ text }) {
  return (
    <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-12 text-center text-sm text-gray-400">
      {text}
    </div>
  );
}

// ─── Reviews ────────────────────────────────────────────────────────────────
// Public list of every review on the course, plus an inline form so enrolled
// students can leave a rating + comment. Their existing review (if any) is
// pre-filled so submitting again edits in place.
function ReviewsTab({ courseId, enrollment }) {
  const [reviews, setReviews] = useState([]);
  const [average, setAverage] = useState(0);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const myInfo = getUserInfo();
  const myId = myInfo?._id;
  const isEnrolled = !!enrollment;

  const myReview = reviews.find(
    (r) => String(r.userId?._id || r.userId) === String(myId)
  );

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");

  function load() {
    setLoading(true);
    setError("");
    getCourseReviews(courseId)
      .then((data) => {
        setReviews(Array.isArray(data.reviews) ? data.reviews : []);
        setAverage(data.average || 0);
        setCount(data.count || 0);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  // Pre-fill the form whenever the user's existing review changes (e.g. after load).
  useEffect(() => {
    if (myReview) {
      setRating(myReview.rating);
      setComment(myReview.comment || "");
    } else {
      setRating(0);
      setComment("");
    }
  }, [myReview?._id]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isEnrolled) return;
    if (rating < 1 || rating > 5) {
      setFeedback("Please pick a rating between 1 and 5 stars.");
      return;
    }
    try {
      setBusy(true);
      setFeedback("");
      await postCourseReview(courseId, rating, comment.trim());
      setFeedback(myReview ? "Review updated." : "Thanks for your review!");
      load();
    } catch (err) {
      setFeedback(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Delete your review?")) return;
    try {
      setBusy(true);
      await deleteCourseReview(courseId);
      setRating(0);
      setComment("");
      setFeedback("Your review was removed.");
      load();
    } catch (err) {
      setFeedback(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Summary card */}
      <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-5 flex items-center gap-5">
        <div className="text-center shrink-0">
          <p className="font-heading font-black text-charcoal text-4xl leading-none">
            {average ? average.toFixed(1) : "—"}
          </p>
          <StarRow value={Math.round(average)} size={14} />
          <p className="text-[11px] text-gray-400 mt-1">
            {count} review{count === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-charcoal mb-1">
            What students think
          </p>
          <p className="text-xs text-gray-500 leading-relaxed">
            {count > 0
              ? "Read what other students said, then share your own feedback below."
              : "No reviews yet — be the first to share your feedback once you've taken the course."}
          </p>
        </div>
      </div>

      {/* Add / edit form — only enrolled students */}
      {isEnrolled ? (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-card border border-gray-100 p-5"
        >
          <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
            <p className="text-sm font-bold text-charcoal">
              {myReview ? "Update your review" : "Leave a review"}
            </p>
            {myReview && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={busy}
                className="text-xs font-bold text-brandRed hover:underline disabled:opacity-40"
              >
                Delete review
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 mb-3">
            {[1, 2, 3, 4, 5].map((n) => {
              const filled = (hoverRating || rating) >= n;
              return (
                <button
                  key={n}
                  type="button"
                  onMouseEnter={() => setHoverRating(n)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(n)}
                  className={`transition ${filled ? "text-yellow-400" : "text-gray-300 hover:text-yellow-300"}`}
                  aria-label={`${n} star${n === 1 ? "" : "s"}`}
                >
                  <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.446a1 1 0 00-.364 1.118l1.287 3.957c.3.922-.755 1.688-1.54 1.118l-3.366-2.446a1 1 0 00-1.176 0l-3.367 2.446c-.784.57-1.838-.196-1.539-1.118l1.286-3.957a1 1 0 00-.363-1.118L2.07 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.951-.69l1.286-3.957z" />
                  </svg>
                </button>
              );
            })}
            <span className="text-xs text-gray-400 ml-1">
              {rating > 0 ? `${rating} of 5` : "Tap a star"}
            </span>
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What did you think of the course? (optional)"
            rows="4"
            maxLength={2000}
            className="w-full bg-softGrey rounded-xl border border-transparent focus:border-brandRed focus:bg-white transition px-4 py-3 text-sm resize-none outline-none"
          />

          <div className="flex items-center justify-between mt-3 gap-3 flex-wrap">
            <p className="text-[11px] text-gray-400">
              {feedback || `${comment.length} / 2000 characters`}
            </p>
            <button
              type="submit"
              disabled={busy || rating < 1}
              className="px-5 py-2.5 rounded-xl bg-brandRed text-white text-sm font-bold hover:bg-red-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {busy ? "Saving…" : myReview ? "Update review" : "Post review"}
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-5 text-sm text-gray-500">
          You need to be enrolled in this course to leave a review.
        </div>
      )}

      {/* List */}
      {loading && <PlaceholderCard text="Loading reviews…" />}
      {!loading && error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-brandRed text-sm">
          {error}
        </div>
      )}
      {!loading && !error && reviews.length === 0 && (
        <PlaceholderCard text="No reviews yet." />
      )}

      {!loading && !error && reviews.length > 0 && (
        <div className="space-y-3">
          {reviews.map((r) => (
            <ReviewItem key={r._id} review={r} isMine={String(r.userId?._id || r.userId) === String(myId)} />
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewItem({ review, isMine }) {
  const user = review.userId || {};
  const initials = (user.fullName || "?")
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const date = review.createdAt ? new Date(review.createdAt) : null;

  return (
    <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-5">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-brandRed flex items-center justify-center overflow-hidden shrink-0">
          {user.profileImage ? (
            <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs font-bold text-white">{initials}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-charcoal truncate">
              {user.fullName || "Student"}
            </p>
            {isMine && (
              <span className="bg-brandRed/10 text-brandRed text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded">
                You
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <StarRow value={review.rating} size={12} />
            <span className="text-[11px] text-gray-400">
              {date ? date.toLocaleDateString() : ""}
            </span>
          </div>
        </div>
      </div>
      {review.comment && (
        <p className="text-sm text-charcoal leading-relaxed whitespace-pre-line">
          {review.comment}
        </p>
      )}
    </div>
  );
}

function StarRow({ value = 0, size = 14 }) {
  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          width={size}
          height={size}
          fill="currentColor"
          viewBox="0 0 20 20"
          className={n <= value ? "text-yellow-400" : "text-gray-200"}
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.446a1 1 0 00-.364 1.118l1.287 3.957c.3.922-.755 1.688-1.54 1.118l-3.366-2.446a1 1 0 00-1.176 0l-3.367 2.446c-.784.57-1.838-.196-1.539-1.118l1.286-3.957a1 1 0 00-.363-1.118L2.07 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.951-.69l1.286-3.957z" />
        </svg>
      ))}
    </div>
  );
}
