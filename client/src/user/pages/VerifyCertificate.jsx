import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import usePageTitle from "../hooks/usePageTitle";

const API_BASE = "http://localhost:4000/api";

async function fetchVerify(code) {
  const res = await fetch(`${API_BASE}/user/verify/${encodeURIComponent(code)}`);
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message || "Certificate not found");
  return data;
}

async function fetchFile(code) {
  const res = await fetch(`${API_BASE}/user/verify/${encodeURIComponent(code)}/file`);
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message || "File not found");
  return data;
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    day: "numeric", month: "long", year: "numeric",
  });
}

// ─── File preview modal ───────────────────────────────────────────────────────

function FileModal({ code, certInfo, onClose }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dlBusy, setDlBusy] = useState(false);

  useEffect(() => {
    fetchFile(code)
      .then(setFile)
      .catch(() => setFile(null))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDownload() {
    setDlBusy(true);
    try {
      const f = file || await fetchFile(code);
      const a = document.createElement("a");
      a.href = `data:${f.mimeType};base64,${f.data}`;
      a.download = f.name || `${certInfo.courseName}_Certificate`;
      a.click();
    } finally {
      setDlBusy(false);
    }
  }

  const isImage = file?.mimeType?.startsWith("image/");
  const src = file ? `data:${file.mimeType};base64,${file.data}` : null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl overflow-hidden shadow-2xl w-full flex flex-col"
        style={{ maxWidth: 820, maxHeight: "92vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-sm font-semibold text-gray-800">
              {certInfo.courseName}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-auto bg-gray-50 flex items-center justify-center min-h-[340px]">
          {loading ? (
            <div className="flex flex-col items-center gap-3 text-gray-400">
              <svg className="w-7 h-7 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm">Loading certificate…</span>
            </div>
          ) : !file ? (
            <p className="text-sm text-gray-400">Could not load the certificate file.</p>
          ) : isImage ? (
            <img src={src} alt="Certificate" className="max-w-full max-h-full object-contain" />
          ) : (
            <iframe
              src={src}
              title="Certificate"
              className="w-full"
              style={{ height: 500, border: "none" }}
            />
          )}
        </div>

        {/* Action bar */}
        <div className="bg-white border-t border-gray-100 px-5 py-3 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 font-medium hover:bg-gray-50 transition"
          >
            Close
          </button>
          <button
            onClick={handleDownload}
            disabled={dlBusy || loading || !file}
            className="flex items-center gap-2 px-5 py-2 bg-[#7B0000] text-white rounded-lg text-sm font-semibold hover:bg-red-900 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {dlBusy ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
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

// ─── Main page ────────────────────────────────────────────────────────────────

export default function VerifyCertificate() {
  usePageTitle("Verify Certificate");
  const [searchParams] = useSearchParams();
  const initialCode = searchParams.get("code") || "";
  const [input, setInput] = useState(initialCode);
  const [loading, setLoading] = useState(!!initialCode);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);

  // Auto-verify when a code is pre-filled from the URL
  useEffect(() => {
    if (!initialCode) return;
    fetchVerify(initialCode.toUpperCase())
      .then(setResult)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleVerify(e) {
    e?.preventDefault();
    const code = input.trim().toUpperCase();
    if (!code) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const data = await fetchVerify(code);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col">

      {/* Minimal top bar */}
      <header className="bg-black h-14 flex items-center px-8 gap-3">
        <svg width="28" height="25" viewBox="0 0 52 46" fill="white">
          <polygon points="26,4 50,16 26,28 2,16"/>
          <path d="M13,21 L13,36 Q13,42 26,42 Q39,42 39,36 L39,21 L26,28 Z"/>
          <rect x="49" y="16" width="2.5" height="15" rx="1.25"/>
          <circle cx="50.25" cy="33.5" r="3"/>
        </svg>
        <span className="text-white font-bold text-sm tracking-wide">SonoSchool</span>
        <div className="flex-1" />
        <Link to="/" className="text-white/60 hover:text-white text-xs transition">
          ← Back to site
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">

        {/* Card */}
        <div className="w-full max-w-xl bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

          {/* Card header */}
          <div className="bg-[#7B0000] px-8 py-7 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/15 mb-4">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <h1 className="text-white font-bold text-2xl tracking-tight">Verify Certificate</h1>
            <p className="text-white/70 text-sm mt-1">Enter a certificate code to confirm its authenticity</p>
          </div>

          {/* Input form */}
          <form onSubmit={handleVerify} className="px-8 py-7">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
              Certificate Code
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g. SS-2025-ABC123"
                spellCheck={false}
                className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono tracking-widest outline-none focus:ring-2 focus:ring-[#7B0000]/20 focus:border-[#7B0000] transition placeholder:font-sans placeholder:tracking-normal"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-5 py-3 bg-[#7B0000] text-white rounded-xl text-sm font-semibold hover:bg-red-900 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
              >
                {loading ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
                  </svg>
                )}
                Verify
              </button>
            </div>
          </form>

          {/* Error */}
          {error && (
            <div className="mx-8 mb-7 flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-4">
              <svg className="w-5 h-5 text-[#D62828] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-[#D62828] font-medium">
                {error === "Certificate not found"
                  ? "No certificate found with this code. Please check the code and try again."
                  : error}
              </p>
            </div>
          )}

          {/* Valid result */}
          {result?.valid && (
            <div className="mx-8 mb-7">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 overflow-hidden">
                {/* Valid banner */}
                <div className="bg-emerald-600 px-5 py-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-white text-sm font-bold tracking-wide">Certificate Verified</span>
                </div>

                {/* Details */}
                <div className="px-5 py-5 space-y-3">
                  <DetailRow label="Student Name"  value={result.studentName} />
                  <DetailRow label="Course"        value={result.courseName} />
                  <DetailRow label="Issued On"     value={formatDate(result.issuedAt)} />
                  <DetailRow label="Certificate Code" value={result.code} mono />
                </div>

                {/* View button */}
                <div className="px-5 pb-5">
                  <button
                    onClick={() => setShowModal(true)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-emerald-600 text-emerald-700 text-sm font-semibold hover:bg-emerald-100 transition"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View Certificate
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <p className="mt-6 text-xs text-gray-400 text-center">
          Certificates are issued by SonoSchool instructors.{" "}
          <a href="mailto:info@sonoschool.org" className="underline hover:text-gray-600">
            Contact us
          </a>{" "}
          if you have questions.
        </p>
      </main>

      {/* File preview modal */}
      {showModal && result?.valid && (
        <FileModal
          code={result.code}
          certInfo={result}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

function DetailRow({ label, value, mono }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs font-bold text-gray-500 uppercase tracking-wide flex-shrink-0 pt-0.5">
        {label}
      </span>
      <span className={`text-sm text-gray-800 text-right ${mono ? "font-mono font-semibold tracking-wider" : "font-medium"}`}>
        {value || "—"}
      </span>
    </div>
  );
}
