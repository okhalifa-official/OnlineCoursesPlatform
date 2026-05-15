import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import StudentShell from "../components/StudentShell";
import usePageTitle from "../hooks/usePageTitle";
import SecurePdfViewer from "../components/SecurePdfViewer";
import {
  getEnrolledCourse,
  getUserToken,
  setLessonProgress,
} from "../api/userApi";

const TABS = ["Overview", "Transcript", "Notes", "Material"];

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

function saveProgress(courseId, progress) {
  try {
    localStorage.setItem(progressKey(courseId), JSON.stringify(progress));
  } catch {}
}

function lessonId(mi, li) {
  return `${mi}-${li}`;
}

function notesKey(courseId, mi, li) {
  return `course-notes:${courseId}:${mi}-${li}`;
}

/**
 * Detects YouTube / Vimeo URLs and returns an embeddable URL, or null
 * if the URL is a direct video file (mp4 / webm / etc) that <video> can play.
 */
function getEmbedUrl(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com") || u.hostname.includes("youtu.be")) {
      const id =
        u.hostname.includes("youtu.be")
          ? u.pathname.slice(1)
          : u.searchParams.get("v") || u.pathname.split("/").pop();
      return `https://www.youtube.com/embed/${id}`;
    }
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean).pop();
      return `https://player.vimeo.com/video/${id}`;
    }
  } catch {
    return null;
  }
  return null;
}

export default function LectureView() {
  const { id, mi, li } = useParams();
  const moduleIndex = Number(mi);
  const lessonIndex = Number(li);
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  const lesson = course?.modules?.[moduleIndex]?.lessons?.[lessonIndex];
  usePageTitle(lesson?.title || course?.title || "Lecture");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("Overview");
  const [progress, setProgress] = useState({});
  const [notes, setNotes] = useState("");
  const [openLecturePdf, setOpenLecturePdf] = useState(false);
  // Hoisted above the early returns so React sees the same hook order on
  // every render — `useRef` here used to sit after the loading check, which
  // crashed the page once data arrived ("Rendered more hooks than during
  // the previous render").
  const markedRef = useRef(false);

  useEffect(() => {
    if (!getUserToken()) {
      navigate("/login");
      return;
    }
    setLoading(true);
    getEnrolledCourse(id)
      .then((data) => {
        setCourse(data);
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

  // Reload notes (and reset the auto-complete latch) when navigating between
  // lessons — the component stays mounted, so without this the markedRef
  // sticks true and the next lecture wouldn't auto-complete from video time.
  useEffect(() => {
    if (!course) return;
    try {
      setNotes(localStorage.getItem(notesKey(id, moduleIndex, lessonIndex)) || "");
    } catch {
      setNotes("");
    }
    markedRef.current = false;
  }, [id, moduleIndex, lessonIndex, course]);

  // Flatten modules/lessons into a single ordered list for prev/next navigation
  // and for the "Up next" sidebar.
  const flatLessons = useMemo(() => {
    if (!course?.modules) return [];
    const flat = [];
    course.modules.forEach((module, mIdx) => {
      (module.lessons || []).forEach((lesson, lIdx) => {
        flat.push({
          mi: mIdx,
          li: lIdx,
          moduleTitle: module.title,
          ...lesson,
          number: flat.length + 1,
        });
      });
    });
    return flat;
  }, [course]);

  if (loading) {
    return (
      <StudentShell activeLink="My Courses">
        <div className="px-8 py-12 animate-pulse text-gray-400">Loading lecture…</div>
      </StudentShell>
    );
  }

  if (error || !course) {
    return (
      <StudentShell activeLink="My Courses">
        <div className="px-8 py-12">
          <p className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-brandRed text-sm">
            {error || "Lecture not found."}
          </p>
        </div>
      </StudentShell>
    );
  }

  const currentIndex = flatLessons.findIndex(
    (l) => l.mi === moduleIndex && l.li === lessonIndex
  );
  const lecture = flatLessons[currentIndex];

  if (!lecture) {
    return (
      <StudentShell activeLink="My Courses">
        <div className="px-8 py-12">
          <p className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-brandRed text-sm">
            Lecture not found.
          </p>
          <Link to={`/learn/${id}`} className="text-brandRed text-sm mt-4 inline-block">
            Back to course
          </Link>
        </div>
      </StudentShell>
    );
  }

  const prev = currentIndex > 0 ? flatLessons[currentIndex - 1] : null;
  const next = currentIndex < flatLessons.length - 1 ? flatLessons[currentIndex + 1] : null;
  const lectureNumber = currentIndex + 1;

  // Marks the current lecture complete (idempotent). Called automatically when
  // the student plays through to within the last 3 minutes of the video.
  const lid = lessonId(moduleIndex, lessonIndex);
  const alreadyDone = Boolean(progress[lid]);
  // Seed the ref from existing progress on first render of each lecture.
  if (alreadyDone && !markedRef.current) markedRef.current = true;
  function markComplete() {
    if (markedRef.current) return;
    markedRef.current = true;
    const updated = { ...progress, [lid]: true };
    setProgress(updated);
    saveProgress(id, updated);
    setLessonProgress(id, lid, true).catch(() => {});
  }

  function goNext() {
    if (next) {
      navigate(`/learn/${id}/lecture/${next.mi}/${next.li}`);
    } else {
      navigate(`/learn/${id}`);
    }
  }

  // Watching the last 3 minutes (or finishing) of the video counts as
  // completion — no Mark complete button to press manually.
  function handleTimeUpdate(e) {
    const v = e.currentTarget;
    if (!v || markedRef.current) return;
    const duration = Number(v.duration);
    const current = Number(v.currentTime);
    if (!Number.isFinite(duration) || duration <= 0) return;
    if (current >= duration - 180 || v.ended) {
      markComplete();
    }
  }

  function handleNotesChange(e) {
    const value = e.target.value;
    setNotes(value);
    try {
      localStorage.setItem(notesKey(id, moduleIndex, lessonIndex), value);
    } catch {}
  }

  const videoFile = lecture.videoFile || "";
  const videoURL = lecture.videoURL || "";
  const useUpload = Boolean(videoFile);
  const embedUrl = !useUpload ? getEmbedUrl(videoURL) : null;
  const directVideoUrl =
    !useUpload && !embedUrl && videoURL ? videoURL : null;

  return (
    <StudentShell activeLink="My Courses">
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] min-h-screen">
        {/* ─── Center column ─── */}
        <div className="bg-charcoal text-white">
          {/* Top bar */}
          <div className="flex items-center justify-between gap-4 px-8 py-5 border-b border-white/5">
            <div className="flex items-center gap-3 min-w-0">
              <Link
                to={`/learn/${id}`}
                className="w-9 h-9 rounded-full border border-white/15 hover:bg-white/5 flex items-center justify-center shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div className="min-w-0">
                <p className="font-heading font-bold text-base truncate">
                  Lecture {lectureNumber} · {lecture.title}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {course.courseName} · {lecture.moduleTitle}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button className="px-4 py-2 text-sm font-semibold rounded-lg border border-white/15 hover:bg-white/5 transition">
                Save
              </button>
              <button className="px-4 py-2 text-sm font-semibold rounded-lg border border-white/15 hover:bg-white/5 transition">
                Report
              </button>
              <UserAvatar />
            </div>
          </div>

          {/* Player */}
          <div className="px-8 pt-8">
            <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-white/5">
              {useUpload && (
                <video
                  key={videoFile}
                  src={videoFile}
                  controls
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={markComplete}
                  className="w-full h-full"
                />
              )}
              {!useUpload && embedUrl && (
                <iframe
                  key={embedUrl}
                  src={embedUrl}
                  title={lecture.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              )}
              {!useUpload && !embedUrl && directVideoUrl && (
                <video
                  key={directVideoUrl}
                  src={directVideoUrl}
                  controls
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={markComplete}
                  className="w-full h-full"
                />
              )}
              {!useUpload && !embedUrl && !directVideoUrl && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 text-sm">
                  <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  No video uploaded for this lecture yet.
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="px-8 pt-8 border-b border-white/5 flex items-center gap-6">
            {TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-semibold transition relative ${
                  activeTab === tab ? "text-white" : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <span className="absolute -bottom-px left-0 right-0 h-0.5 bg-brandRed rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="px-8 py-8">
            {activeTab === "Overview" && (
              <div>
                <h2 className="font-heading font-bold text-2xl mb-3">{lecture.title}</h2>
                {lecture.description ? (
                  <p className="text-gray-300 leading-relaxed text-sm whitespace-pre-line">
                    {lecture.description}
                  </p>
                ) : (
                  <p className="text-gray-500 text-sm italic">
                    No overview provided for this lecture.
                  </p>
                )}
              </div>
            )}

            {activeTab === "Transcript" && (
              <p className="text-gray-500 text-sm italic">
                Transcript is not available yet.
              </p>
            )}

            {activeTab === "Notes" && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">
                  Your timestamp notes
                </p>
                <textarea
                  value={notes}
                  onChange={handleNotesChange}
                  placeholder="Type personal notes for this lecture…"
                  rows="6"
                  className="w-full bg-white/5 border border-white/10 focus:border-brandRed rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none resize-y"
                />
                <p className="text-[11px] text-gray-500 mt-2">
                  Notes are saved automatically on this device.
                </p>
              </div>
            )}

            {activeTab === "Material" && (
              <LectureMaterialPanel
                lecture={lecture}
                onOpenPdf={() => setOpenLecturePdf(true)}
              />
            )}
          </div>

          {/* Prev · status · Next — lecture marks itself complete once the
              student plays the last 3 minutes (or reaches the end) of the
              video, so there's no manual "Mark complete" button. */}
          <div className="px-8 pb-12 flex items-center justify-between gap-4 flex-wrap">
            <button
              type="button"
              disabled={!prev}
              onClick={() =>
                prev && navigate(`/learn/${id}/lecture/${prev.mi}/${prev.li}`)
              }
              className="px-6 py-3 rounded-xl bg-white text-charcoal font-semibold text-sm hover:bg-gray-200 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ← Previous lecture
            </button>

            <div className="flex items-center gap-3 flex-wrap">
              {alreadyDone ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/15 text-emerald-300 text-xs font-semibold">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Completed
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    markComplete();
                    goNext();
                  }}
                  className="px-5 py-3 rounded-xl border border-emerald-400/40 text-emerald-300 text-sm font-semibold hover:bg-emerald-500/10 transition inline-flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Mark complete
                </button>
              )}

              <button
                type="button"
                onClick={goNext}
                className="px-6 py-3 rounded-xl bg-brandRed text-white font-bold text-sm hover:bg-red-700 transition flex items-center gap-2"
              >
                {next ? "Next lecture" : "Back to course"}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* ─── Right rail: Up next ─── */}
        <aside className="bg-charcoal/95 border-l border-white/5 px-6 py-8 text-white">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-5">
            Up next in this course
          </p>

          <div className="space-y-3">
            {flatLessons.map((l) => {
              const isCurrent = l.mi === moduleIndex && l.li === lessonIndex;
              const done = !!progress[lessonId(l.mi, l.li)];
              return (
                <Link
                  key={`${l.mi}-${l.li}`}
                  to={`/learn/${id}/lecture/${l.mi}/${l.li}`}
                  className={`flex items-start gap-3 p-3 rounded-xl transition ${
                    isCurrent
                      ? "bg-brandRed/15 ring-1 ring-brandRed"
                      : "hover:bg-white/5"
                  }`}
                >
                  <span
                    className={`w-12 h-12 shrink-0 rounded-lg flex items-center justify-center ${
                      isCurrent
                        ? "bg-brandRed"
                        : done
                        ? "bg-emerald-600"
                        : "bg-white/5"
                    }`}
                  >
                    {isCurrent ? (
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    ) : done ? (
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className="text-sm font-bold text-gray-400">{l.number}</span>
                    )}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-semibold truncate ${
                        isCurrent ? "text-white" : "text-gray-200"
                      }`}
                    >
                      {l.number}. {l.title}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {isCurrent
                        ? "Now playing"
                        : [l.duration, l.type].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </aside>
      </div>

      {openLecturePdf && lecture?.pdfFile && (
        <SecurePdfViewer
          material={{
            name: lecture.pdfName || "Lecture PDF",
            mimeType: "application/pdf",
            data: lecture.pdfFile,
            sizeKB: lecture.pdfSizeKB,
          }}
          onClose={() => setOpenLecturePdf(false)}
        />
      )}
    </StudentShell>
  );
}

function LectureMaterialPanel({ lecture, onOpenPdf }) {
  const hasPdf = Boolean(lecture?.pdfFile);

  if (!hasPdf) {
    return (
      <p className="text-gray-500 text-sm italic">
        No material attached to this lecture.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onOpenPdf}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition text-left"
      >
        <span className="material-symbols-outlined text-brandRed">picture_as_pdf</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">
            {lecture.pdfName || "Lecture PDF"}
          </p>
          <p className="text-[11px] text-gray-400">
            {lecture.pdfSizeKB ? `${lecture.pdfSizeKB} KB · ` : ""}
            Opens in the secure viewer
          </p>
        </div>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}

function UserAvatar() {
  let info = null;
  try {
    info = JSON.parse(localStorage.getItem("userInfo"));
  } catch {}
  const initials = info?.fullName
    ? info.fullName.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";
  return (
    <div className="w-9 h-9 rounded-full bg-brandRed flex items-center justify-center overflow-hidden">
      {info?.profileImage ? (
        <img src={info.profileImage} alt="avatar" className="w-full h-full object-cover" />
      ) : (
        <span className="text-xs font-bold text-white">{initials}</span>
      )}
    </div>
  );
}
