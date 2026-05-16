import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  clearUserToken,
  getUserToken,
  getMyCertificates,
  downloadCertificateFile,
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

const CERT_COLORS = {
  pocus:      "#1E3A5F",
  echo:       "#5C1A1A",
  cardiology: "#1D3557",
  radiology:  "#064E3B",
  emergency:  "#78350F",
  msk:        "#0D4A3E",
  default:    "#1F2937",
};

function getCertColor(category) {
  if (!category) return CERT_COLORS.default;
  const key = Object.keys(CERT_COLORS).find((k) =>
    category.toLowerCase().includes(k)
  );
  return CERT_COLORS[key] || CERT_COLORS.default;
}

function certCode(enrollment) {
  const d = enrollment.certificate?.uploadedAt || enrollment.updatedAt || enrollment.createdAt;
  const year = new Date(d).getFullYear();
  const hex = enrollment._id.slice(-6).toUpperCase();
  return `SS-${year}-${hex}`;
}

async function triggerFileDownload(enrollmentId, fallbackName) {
  const f = await downloadCertificateFile(enrollmentId);
  const a = document.createElement("a");
  a.href = `data:${f.mimeType};base64,${f.data}`;
  a.download = f.name || fallbackName || "certificate";
  a.click();
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function getProgress(enrollment) {
  const course = enrollment.courseId;
  if (!course || !Array.isArray(course.modules)) return 0;
  const total = course.modules.reduce(
    (s, m) => s + (Array.isArray(m.lessons) ? m.lessons.length : 0),
    0
  );
  if (total === 0) return 0;
  const completed = Object.values(enrollment.completedLessons || {}).filter(Boolean).length;
  return Math.round((completed / total) * 100);
}

// ─── Certificate view modal — shows the admin-uploaded file ──────────────────

function CertificateModal({ enrollment, onClose }) {
  const [file, setFile] = useState(null);
  const [loadingFile, setLoadingFile] = useState(true);
  const [busy, setBusy] = useState(false);
  const courseName = enrollment.courseId?.courseName || "Certificate";

  useEffect(() => {
    downloadCertificateFile(enrollment._id)
      .then(setFile)
      .catch(() => setFile(null))
      .finally(() => setLoadingFile(false));
  }, [enrollment._id]);

  async function handleDownload() {
    setBusy(true);
    try { await triggerFileDownload(enrollment._id, `${courseName}_Certificate`); }
    finally { setBusy(false); }
  }

  const isImage = file?.mimeType?.startsWith("image/");
  const src = file ? `data:${file.mimeType};base64,${file.data}` : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-xl overflow-hidden shadow-2xl w-full flex flex-col"
        style={{ maxWidth: 780, maxHeight: "90vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <p className="font-semibold text-charcoal text-sm truncate pr-4">{courseName}</p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* File preview area */}
        <div className="flex-1 overflow-auto bg-gray-50 flex items-center justify-center min-h-[320px]">
          {loadingFile ? (
            <div className="flex flex-col items-center gap-3 text-gray-400">
              <svg className="w-7 h-7 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              <span className="text-sm">Loading certificate…</span>
            </div>
          ) : !file ? (
            <p className="text-sm text-gray-400">Could not load certificate file.</p>
          ) : isImage ? (
            <img src={src} alt="Certificate" className="max-w-full max-h-full object-contain" />
          ) : (
            <iframe
              src={src}
              title="Certificate"
              className="w-full"
              style={{ height: 480, border: "none" }}
            />
          )}
        </div>

        {/* Action bar */}
        <div className="bg-white border-t border-gray-200 px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs text-gray-500 font-medium">Issued by SonoSchool</span>
          </div>
          <button
            onClick={handleDownload}
            disabled={busy || loadingFile || !file}
            className="flex items-center gap-2 px-5 py-2 bg-[#7B0000] text-white rounded-lg text-sm font-semibold hover:bg-red-900 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {busy ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Saving…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Certificate card ─────────────────────────────────────────────────────────

function CertCard({ enrollment, onView }) {
  const [copied, setCopied] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const color = getCertColor(enrollment.courseId?.category);
  const code = certCode(enrollment);
  const date = formatDate(enrollment.certificate?.uploadedAt || enrollment.updatedAt);
  const courseName = enrollment.courseId?.courseName || "Course";

  function handleShare() {
    const text = `I completed "${courseName}" at SonoSchool! Certificate code: ${code}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function handlePdf() {
    setPdfBusy(true);
    try {
      await triggerFileDownload(enrollment._id, `${courseName}_Certificate`);
    } finally {
      setPdfBusy(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden flex hover:shadow-md transition-shadow">
      {/* Colored left panel */}
      <div
        className="w-28 flex-shrink-0 flex flex-col items-center justify-between py-6 px-3"
        style={{ background: color }}
      >
        <svg
          className="w-9 h-9 text-white/60"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
        <span className="text-white text-[9px] font-bold tracking-widest uppercase">
          Verified
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 p-5">
        <h3 className="font-semibold text-charcoal text-[15px] leading-snug mb-1">
          {courseName}
        </h3>
        <p className="text-gray-400 text-xs mb-0.5">{date}</p>
        <p className="text-gray-400 text-xs mb-4">
          Code &nbsp;·&nbsp;
          <span className="text-charcoal font-mono font-medium text-[11px]">{code}</span>
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onView(enrollment)}
            className="px-4 py-1.5 border border-gray-200 rounded-lg text-sm text-charcoal font-medium hover:bg-gray-50 transition"
          >
            View
          </button>
          <button
            onClick={handlePdf}
            disabled={pdfBusy}
            className="px-4 py-1.5 border border-gray-200 rounded-lg text-sm text-charcoal font-medium hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {pdfBusy ? (
              <>
                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Saving…
              </>
            ) : "PDF"}
          </button>
          <button
            onClick={handleShare}
            className="ml-auto px-4 py-1.5 bg-brandRed text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition min-w-[64px]"
          >
            {copied ? "Copied!" : "Share"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Certificates() {
  usePageTitle("My Certificates");
  const navigate = useNavigate();

  const [passed, setPassed] = useState([]);
  const [inProgress, setInProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewEnrollment, setViewEnrollment] = useState(null);

  useEffect(() => {
    if (!getUserToken()) {
      navigate("/register", { replace: true });
      return;
    }
    getMyCertificates()
      .then((data) => {
        setPassed(Array.isArray(data.passed) ? data.passed : []);
        setInProgress(Array.isArray(data.inProgress) ? data.inProgress : []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [navigate]);

  function handleLogout() {
    clearUserToken();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-softGrey">
      <UserNavbar links={NAV_LINKS} />

      <div className="flex" style={{ minHeight: "calc(100vh - 3.5rem)" }}>
        <UserSidebar
          links={SIDEBAR_LINKS}
          activeLink="Certificates"
          onLogout={handleLogout}
        />

        <main className="flex-1 flex flex-col">
          {/* Breadcrumb bar */}
          <div className="sticky top-14 z-10 bg-softGrey border-b border-gray-200 px-8 py-4 flex items-center justify-between">
            <p className="text-sm text-gray-400">
              Home / <span className="text-charcoal font-medium">Certificates</span>
            </p>
            {/* Sort button */}
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-500 hover:border-gray-300 transition shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M7 8h10M11 12h6M14 16h3" />
              </svg>
              Sort by &nbsp;·&nbsp;
              <span className="font-semibold text-charcoal">Recent</span>
            </button>
          </div>

          <div className="flex-1 p-8">
            {/* Header */}
            <div className="mb-6">
              <h1 className="font-heading font-bold text-charcoal text-3xl mb-1">
                Certificates
              </h1>
              {!loading && (
                <p className="text-gray-400 text-sm">
                  {passed.length} issued &nbsp;·&nbsp; {inProgress.length} in progress
                </p>
              )}
            </div>

            {/* Loading skeletons */}
            {loading && (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl shadow-sm h-28 animate-pulse"
                  />
                ))}
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-brandRed text-sm">
                {error}
              </div>
            )}

            {!loading && !error && (
              <>
                {/* ── Issued ── */}
                <section className="mb-8">
                  <h2 className="font-semibold text-charcoal text-sm mb-4">Issued</h2>

                  {passed.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
                      <svg
                        className="w-10 h-10 text-gray-200 mx-auto mb-3"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.5}
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                      <p className="text-gray-400 text-sm">
                        No certificates issued yet. Pass an exam to earn your first certificate.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                      {passed.map((enrollment) => (
                        <CertCard
                          key={enrollment._id}
                          enrollment={enrollment}
                          onView={setViewEnrollment}
                        />
                      ))}
                    </div>
                  )}
                </section>

                {/* ── In progress ── */}
                {inProgress.length > 0 && (
                  <section>
                    <h2 className="font-semibold text-charcoal text-sm mb-4">
                      Courses in progress
                    </h2>
                    <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-100">
                      {inProgress.map((enrollment) => {
                        const progress = getProgress(enrollment);
                        const courseName =
                          enrollment.courseId?.courseName || "Course";
                        return (
                          <div
                            key={enrollment._id}
                            className="flex items-center gap-4 px-6 py-4"
                          >
                            <div className="w-1 h-8 rounded-full bg-brandRed flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-charcoal text-sm truncate">
                                {courseName}
                              </p>
                              <p className="text-gray-400 text-xs">
                                Awaiting certificate from instructor
                              </p>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-brandRed rounded-full"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <span className="text-xs font-semibold text-charcoal w-8 text-right">
                                {progress}%
                              </span>
                              {/* Circular indicator */}
                              <div className="relative w-9 h-9 flex-shrink-0">
                                <svg className="w-9 h-9 -rotate-90" viewBox="0 0 36 36">
                                  <circle
                                    cx="18" cy="18" r="15"
                                    fill="none"
                                    stroke="#f3f4f6"
                                    strokeWidth="3"
                                  />
                                  <circle
                                    cx="18" cy="18" r="15"
                                    fill="none"
                                    stroke="#C41E3A"
                                    strokeWidth="3"
                                    strokeDasharray={`${(progress / 100) * 94.2} 94.2`}
                                    strokeLinecap="round"
                                  />
                                </svg>
                                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-charcoal">
                                  {progress}%
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Certificate viewer modal */}
      {viewEnrollment && (
        <CertificateModal
          enrollment={viewEnrollment}
          onClose={() => setViewEnrollment(null)}
        />
      )}
    </div>
  );
}
