import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  clearUserToken,
  getDashboard,
  downloadCourseMaterial,
  downloadCertificateFile,
  getUserToken,
  getUserInfo,
} from "../api/userApi";
import UserNavbar from "../components/UserNavbar";
import UserSidebar from "../components/UserSidebar";
import usePageTitle from "../hooks/usePageTitle";

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
    to: "/certificates",
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>,
  },
  {
    label: "Profile",
    to: "/user-profile",
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  },
];

// ─── pure helpers ─────────────────────────────────────────────────────────────

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function loadProgress(courseId) {
  try {
    return JSON.parse(localStorage.getItem(`course-progress:${courseId}`)) || {};
  } catch { return {}; }
}

function lessonKey(mi, li) { return `${mi}-${li}`; }

function computePct(modules, progress) {
  let total = 0, done = 0;
  (modules || []).forEach((m, mi) => {
    (m.lessons || []).forEach((l, li) => {
      if (l.type === "pdf") return;
      total++;
      if (progress[lessonKey(mi, li)]) done++;
    });
  });
  return total === 0 ? 0 : Math.round((done / total) * 100);
}

function countVideoLectures(modules) {
  return (modules || []).reduce(
    (s, m) => s + (m.lessons || []).filter((l) => l.type !== "pdf").length,
    0
  );
}

function findResume(modules, progress) {
  for (let mi = 0; mi < (modules || []).length; mi++) {
    const lessons = modules[mi].lessons || [];
    for (let li = 0; li < lessons.length; li++) {
      if (lessons[li].type === "pdf") continue;
      if (!progress[lessonKey(mi, li)]) return { mi, li, lesson: lessons[li] };
    }
  }
  // All done — last video lesson
  for (let mi = (modules || []).length - 1; mi >= 0; mi--) {
    const lessons = modules[mi].lessons || [];
    for (let li = lessons.length - 1; li >= 0; li--) {
      if (lessons[li].type !== "pdf") return { mi, li, lesson: lessons[li] };
    }
  }
  return null;
}

function videoLectureNumber(modules, mi, li) {
  let n = 0;
  for (let i = 0; i <= mi; i++) {
    const lessons = (modules[i]?.lessons || []);
    const cap = i === mi ? li : lessons.length - 1;
    for (let j = 0; j <= cap; j++) {
      if (lessons[j]?.type !== "pdf") n++;
    }
  }
  return n;
}

function daysLabel(expiryDate) {
  if (!expiryDate) return null;
  const diff = Math.ceil((new Date(expiryDate) - Date.now()) / 86400000);
  if (diff <= 0) return "Expired";
  if (diff === 1) return "1 DAY";
  return `${diff} DAYS`;
}

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr);
  const days = Math.floor(diff / 86400000);
  const weeks = Math.floor(days / 7);
  if (weeks >= 2) return `${weeks}w ago`;
  if (days >= 7) return "1w ago";
  if (days >= 1) return `${days}d ago`;
  const hrs = Math.floor(diff / 3600000);
  if (hrs >= 1) return `${hrs}h ago`;
  return "just now";
}

function formatSize(kb) {
  if (!kb) return "";
  return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;
}

function formatDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

const CERT_COLORS = {
  pocus: "#1E3A5F", echo: "#5C1A1A", cardiology: "#1D3557",
  radiology: "#064E3B", emergency: "#78350F", msk: "#0D4A3E", default: "#1F2937",
};
function certColor(category) {
  if (!category) return CERT_COLORS.default;
  const k = Object.keys(CERT_COLORS).find((k) => category.toLowerCase().includes(k));
  return CERT_COLORS[k] || CERT_COLORS.default;
}

const CAT_BG = {
  pocus:      ["#4C1D95", "#6D28D9"],
  echo:       ["#7B1D1D", "#991B1B"],
  cardiology: ["#1E3A8A", "#1D4ED8"],
  radiology:  ["#064E3B", "#065F46"],
  emergency:  ["#78350F", "#92400E"],
  default:    ["#1F2937", "#374151"],
};
function catBg(category) {
  if (!category) return CAT_BG.default;
  const k = Object.keys(CAT_BG).find((k) => category.toLowerCase().includes(k));
  return CAT_BG[k] || CAT_BG.default;
}

// ─── sub-components ───────────────────────────────────────────────────────────

function CircularProgress({ value, size = 52, strokeW = 4 }) {
  const r = (size - strokeW) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90" style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f3f4f6" strokeWidth={strokeW} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke="#C41E3A" strokeWidth={strokeW}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
      />
    </svg>
  );
}

function CourseContinueCard({ enr }) {
  const course = enr.courseId;
  const [from, to] = catBg(course?.category);
  const days = daysLabel(enr.expiryDate);
  const resume = enr.resume;
  const total = enr.totalLectures;
  const lectureNum = enr.lectureNum;
  const done = enr.progress === 100;
  const barColor = done ? "#22c55e" : "#D62828";

  // Exam-only course (no video lectures)
  const isExamOnly = total === 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden flex min-h-[140px] hover:shadow-md transition-shadow">
      {/* Colored left panel */}
      <div
        className="w-36 flex-shrink-0 flex flex-col justify-between p-4 relative overflow-hidden"
        style={{ background: `linear-gradient(160deg, ${from} 0%, ${to} 100%)` }}
      >
        {days && (
          <span className="self-start bg-white/20 text-white text-[9px] font-bold tracking-widest px-2 py-1 rounded uppercase">
            {days}
          </span>
        )}
        <p className="text-white font-bold text-lg leading-snug mt-auto">{course?.courseName}</p>
      </div>

      {/* Right content */}
      <div className="flex-1 p-5 flex flex-col justify-between">
        {isExamOnly ? (
          /* ── Exam-only course ── */
          <>
            <div>
              <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-gray-400 mb-1">
                {enr.hasExam ? "Final exam" : "Course"}
              </p>
              <p className="text-charcoal font-semibold text-sm leading-snug">
                {enr.examPassed ? "Exam passed ✓" : enr.hasExam ? "Ready to attempt" : "No lectures yet"}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${enr.progress}%`, background: barColor }} />
                </div>
                <span className="text-xs font-semibold" style={{ color: barColor }}>{enr.progress}%</span>
              </div>
              <Link
                to={enr.examPassed ? `/learn/${course?._id}` : enr.hasExam ? `/learn/${course?._id}/exam` : `/learn/${course?._id}`}
                className="inline-block text-white text-xs font-bold px-4 py-1.5 rounded-lg hover:opacity-90 transition"
                style={{ background: barColor }}
              >
                {enr.examPassed ? "Review" : enr.hasExam ? "Take exam" : "Open course"}
              </Link>
            </div>
          </>
        ) : resume ? (
          /* ── Normal course with resume point ── */
          <>
            <div>
              <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-gray-400 mb-1">
                Lecture {lectureNum} of {total}
              </p>
              <p className="text-charcoal font-semibold text-sm leading-snug line-clamp-2">
                L{lectureNum} · {resume.lesson?.title || "Continue"}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${enr.progress}%`, background: barColor }} />
                </div>
                <span className="text-xs font-semibold" style={{ color: barColor }}>{enr.progress}%</span>
              </div>
              <Link
                to={`/learn/${course?._id}/lecture/${resume.mi}/${resume.li}`}
                className="inline-block text-white text-xs font-bold px-4 py-1.5 rounded-lg hover:opacity-90 transition"
                style={{ background: barColor }}
              >
                {done ? "Review" : "Resume"}
              </Link>
            </div>
          </>
        ) : (
          /* ── No lectures yet ── */
          <div className="flex flex-col justify-center h-full gap-2">
            <p className="text-xs text-gray-400">No lectures available yet.</p>
            <Link
              to={`/learn/${course?._id}`}
              className="inline-block bg-brandRed text-white text-xs font-bold px-4 py-1.5 rounded-lg hover:bg-red-700 transition w-fit"
            >
              Open course
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Recent certificate row with PDF download ─────────────────────────────────

function DashCertRow({ cert }) {
  const [busy, setBusy] = useState(false);
  const color = certColor(cert.courseId?.category);
  const date = formatDate(cert.certificate?.uploadedAt || cert.updatedAt);

  async function handlePdf() {
    setBusy(true);
    try {
      const f = await downloadCertificateFile(cert._id);
      const a = document.createElement("a");
      a.href = `data:${f.mimeType};base64,${f.data}`;
      a.download = f.name || `${cert.courseId?.courseName || "Certificate"}`;
      a.click();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: color }}
      >
        <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-charcoal text-sm truncate">{cert.courseId?.courseName}</p>
        <p className="text-xs text-gray-400">Issued · {date}</p>
      </div>
      <button
        onClick={handlePdf}
        disabled={busy}
        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-charcoal hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed min-w-[52px] justify-center"
      >
        {busy ? (
          <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        ) : "PDF"}
      </button>
    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function UserHome() {
  usePageTitle("My Dashboard");
  const navigate = useNavigate();
  const userInfo = getUserInfo();

  const [dashData, setDashData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    if (!getUserToken()) {
      navigate("/register", { replace: true });
      return;
    }
    getDashboard()
      .then(setDashData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [navigate]);

  const enriched = useMemo(() => {
    if (!dashData?.enrollments) return [];
    return dashData.enrollments
      .filter((e) => e.courseId)
      .map((e) => {
        const progress = loadProgress(e.courseId._id);
        const rawPct = computePct(e.courseId.modules, progress);
        const resume = findResume(e.courseId.modules, progress);
        const totalLectures = countVideoLectures(e.courseId.modules);
        const lectureNum = resume
          ? videoLectureNumber(e.courseId.modules, resume.mi, resume.li)
          : 0;

        const lastExamResult = (() => {
          try { return JSON.parse(localStorage.getItem(`exam-last:${e.courseId._id}`)) || null; }
          catch { return null; }
        })();
        const examPassed = lastExamResult?.passed === true;
        const hasExam = !!e.courseId.exam?.enabled;

        // Exam-only course: no lectures → progress = 100 if passed (or no exam), else 0
        const pct = totalLectures === 0
          ? (!hasExam || examPassed ? 100 : 0)
          : rawPct;

        return { ...e, progress: pct, resume, totalLectures, lectureNum, examPassed, hasExam };
      });
  }, [dashData]);

  const overallProgress = useMemo(() => {
    if (!enriched.length) return 0;
    return Math.round(enriched.reduce((s, e) => s + e.progress, 0) / enriched.length);
  }, [enriched]);

  const savedDocs = useMemo(() => {
    if (!dashData?.enrollments) return [];
    const docs = [];
    dashData.enrollments.forEach((e) => {
      if (!e.courseId) return;
      (e.courseId.materials || []).forEach((m) => {
        docs.push({ ...m, courseId: e.courseId._id, updatedAt: e.courseId.updatedAt });
      });
    });
    return docs.slice(0, 5);
  }, [dashData]);

  async function handleDownload(doc) {
    const key = `${doc.courseId}-${doc.idx}`;
    setDownloading(key);
    try {
      const mat = await downloadCourseMaterial(doc.courseId, doc.idx);
      const a = document.createElement("a");
      a.href = mat.data;
      a.download = mat.name;
      a.click();
    } catch (err) {
      alert("Download failed: " + err.message);
    } finally {
      setDownloading(null);
    }
  }

  function handleLogout() {
    clearUserToken();
    navigate("/login");
  }

  const firstName = userInfo?.fullName?.trim().split(/\s+/)[0] || "there";
  const activeCount = enriched.length;
  const recentCerts = dashData?.recentCerts || [];

  return (
    <div className="min-h-screen bg-softGrey">
      <UserNavbar links={NAV_LINKS} />

      <div className="flex" style={{ minHeight: "calc(100vh - 3.5rem)" }}>
        <UserSidebar links={SIDEBAR_LINKS} activeLink="Dashboard" onLogout={handleLogout} />

        <main className="flex-1 flex flex-col">
          {/* ── Sticky header ── */}
          <div className="sticky top-14 z-10 bg-softGrey border-b border-gray-200 px-8 py-3 flex items-center justify-between gap-6">
            <p className="text-sm text-gray-400 shrink-0">
              Home / <span className="text-charcoal font-medium">Dashboard</span>
            </p>

            {/* Search bar */}
            <div className="flex-1 max-w-sm relative">
              <svg
                className="w-4 h-4 text-gray-300 absolute left-3 top-1/2 -translate-y-1/2"
                fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search courses, lectures..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-charcoal placeholder-gray-300 focus:outline-none focus:border-brandRed transition"
                readOnly
                onClick={() => navigate("/courses")}
              />
            </div>

            <span className="shrink-0 w-4" />
          </div>

          <div className="flex-1 p-8 space-y-8">

            {/* ── Welcome + stats ── */}
            <div className="flex items-start justify-between gap-6 flex-wrap">
              <div>
                <p className="text-brandRed font-bold text-xs tracking-[0.2em] uppercase mb-1">
                  Welcome back
                </p>
                <h1 className="font-heading font-bold text-charcoal text-3xl mb-1">
                  {greeting()}, {firstName}.
                </h1>
                {loading ? (
                  <div className="h-4 w-72 bg-gray-200 rounded animate-pulse mt-2" />
                ) : (
                  <p className="text-gray-400 text-sm">
                    {activeCount > 0
                      ? <>You have <span className="font-semibold text-charcoal">{activeCount} active course{activeCount !== 1 ? "s" : ""}</span> in progress.</>
                      : "Browse the catalogue and enrol in a course to get started."}
                  </p>
                )}
              </div>

              {/* Stat cards */}
              <div className="flex gap-3">
                {/* Certificates earned */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-4 flex items-center gap-3 min-w-[140px]">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: "#FFF1F2" }}>
                    <svg className="w-5 h-5 text-brandRed" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-charcoal text-lg leading-none mb-0.5">
                      {loading ? "—" : recentCerts.length}
                    </p>
                    <p className="text-xs text-gray-400 font-medium">Certificates</p>
                    <p className="text-[10px] text-gray-300">earned</p>
                  </div>
                </div>

                {/* Overall progress */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-4 flex items-center gap-3 min-w-[160px]">
                  <div className="relative flex items-center justify-center" style={{ width: 52, height: 52 }}>
                    <CircularProgress value={loading ? 0 : overallProgress} />
                    <span className="absolute text-[11px] font-bold text-charcoal">
                      {loading ? "—" : `${overallProgress}%`}
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-charcoal text-sm leading-snug mb-0.5">Overall progress</p>
                    <p className="text-[11px] text-gray-400">
                      {loading ? "…" : `${activeCount} active course${activeCount !== 1 ? "s" : ""}`}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Continue learning ── */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h2 className="font-heading font-bold text-charcoal text-xl">Continue learning</h2>
                  {!loading && activeCount > 0 && (
                    <span className="bg-red-50 text-brandRed text-xs font-semibold px-2.5 py-0.5 rounded-full">
                      {activeCount} active
                    </span>
                  )}
                </div>
                <Link
                  to="/my-courses"
                  className="text-brandRed text-sm font-semibold hover:underline flex items-center gap-1"
                >
                  Show all
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>

              {loading && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="bg-white rounded-2xl shadow-sm h-36 animate-pulse" />
                  ))}
                </div>
              )}

              {!loading && error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-brandRed text-sm">
                  {error}
                </div>
              )}

              {!loading && !error && enriched.length === 0 && (
                <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
                  <p className="text-gray-400 text-sm mb-4">You're not enrolled in any courses yet.</p>
                  <Link
                    to="/courses"
                    className="inline-block bg-brandRed text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-red-700 transition"
                  >
                    Browse courses
                  </Link>
                </div>
              )}

              {!loading && !error && enriched.length > 0 && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {enriched.slice(0, 4).map((enr) => (
                    <CourseContinueCard key={enr._id} enr={enr} />
                  ))}
                </div>
              )}
            </section>

            {/* ── Bottom two-column section ── */}
            {!loading && (recentCerts.length > 0 || savedDocs.length > 0) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Recent certificates */}
                {recentCerts.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-charcoal text-base">Recent certificates</h3>
                      <Link to="/certificates" className="text-brandRed text-xs font-semibold hover:underline">
                        View all
                      </Link>
                    </div>
                    <div className="space-y-3">
                      {recentCerts.map((cert) => (
                        <DashCertRow
                          key={cert._id}
                          cert={cert}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Saved documents */}
                {savedDocs.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-sm p-6">
                    <h3 className="font-semibold text-charcoal text-base mb-4">Saved documents</h3>
                    <div className="space-y-3">
                      {savedDocs.map((doc) => {
                        const key = `${doc.courseId}-${doc.idx}`;
                        return (
                          <div key={key} className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-charcoal text-sm truncate">{doc.name}</p>
                              <p className="text-xs text-gray-400">
                                {formatSize(doc.sizeKB)}{doc.updatedAt ? ` · Updated ${timeAgo(doc.updatedAt)}` : ""}
                              </p>
                            </div>
                            <button
                              onClick={() => handleDownload(doc)}
                              disabled={downloading === key}
                              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition flex-shrink-0 disabled:opacity-50"
                              title="Download"
                            >
                              {downloading === key ? (
                                <svg className="w-3.5 h-3.5 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                              ) : (
                                <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Empty state when both panels are empty and not loading */}
            {!loading && !error && recentCerts.length === 0 && savedDocs.length === 0 && enriched.length === 0 && (
              <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-12 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-softGrey flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <p className="font-heading font-semibold text-charcoal mb-1">Nothing here yet.</p>
                <p className="text-gray-400 text-sm mb-5">
                  Enrol in a course to start building your dashboard.
                </p>
                <Link
                  to="/courses"
                  className="bg-brandRed text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-red-700 transition"
                >
                  Browse courses
                </Link>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
