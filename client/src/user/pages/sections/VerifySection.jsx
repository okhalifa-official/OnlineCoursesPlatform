import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLandingData } from "../../utils/LandingDataContext";
import useSiteContent from "../../hooks/useSiteContent";

const API_BASE = "http://localhost:4000/api";

async function verifyCert(code) {
  const res = await fetch(`${API_BASE}/user/verify/${encodeURIComponent(code.trim().toUpperCase())}`);
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message || "Certificate not found");
  return data;
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    day: "numeric", month: "long", year: "numeric",
  });
}

export default function VerifySection() {
  const navigate = useNavigate();
  const data = useLandingData();
  const xmlVerify = data?.verify || {};
  const { getSection } = useSiteContent("landing");
  const cmsVerify = getSection("verify");

  const eyebrow    = cmsVerify?.subtitle   || xmlVerify?.eyebrow    || "Verify";
  const headline   = cmsVerify?.title      || xmlVerify?.headline   || "Verify your certificate";
  const body       = cmsVerify?.body       || xmlVerify?.body       || "Enter your certificate code to confirm its authenticity through Sono School.";
  const placeholder = cmsVerify?.items?.find((i) => i.key === "placeholder")?.value
    || xmlVerify?.placeholder || "Enter certificate code";
  const buttonLabel = cmsVerify?.buttonText || xmlVerify?.buttonLabel || "Verify";

  const [input,   setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState(null);   // { valid, studentName, … }
  const [error,   setError]   = useState("");

  async function handleVerify() {
    const code = input.trim();
    if (!code) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const r = await verifyCert(code);
      setResult(r);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") handleVerify();
  }

  return (
    <section id="verify" className="bg-softGrey py-20">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <p className="text-brandRed text-xs font-bold uppercase tracking-widest mb-3">
          {eyebrow}
        </p>

        <h2
          className="font-heading font-black text-charcoal mb-4"
          style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)" }}
        >
          {headline}
        </h2>

        <p className="text-gray-500 text-sm mb-8 max-w-md mx-auto whitespace-pre-line">
          {body}
        </p>

        {/* Input row */}
        <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => { setInput(e.target.value); setResult(null); setError(""); }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            spellCheck={false}
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-charcoal placeholder-gray-300 focus:outline-none focus:border-brandRed transition bg-white font-mono tracking-widest"
          />
          <button
            type="button"
            onClick={handleVerify}
            disabled={loading || !input.trim()}
            className="bg-brandRed text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-red-700 transition text-sm whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            ) : null}
            {buttonLabel}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 max-w-md mx-auto flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-left">
            <svg className="w-4 h-4 text-brandRed flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <p className="text-sm text-brandRed font-medium">Certificate not found. Please check the code and try again.</p>
          </div>
        )}

        {/* Valid result */}
        {result?.valid && (
          <div className="mt-4 max-w-md mx-auto rounded-xl border border-emerald-200 overflow-hidden text-left">
            <div className="bg-emerald-600 px-4 py-2.5 flex items-center gap-2">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
              </svg>
              <span className="text-white text-sm font-bold tracking-wide">Certificate Verified</span>
            </div>
            <div className="bg-emerald-50 px-4 py-4 space-y-2">
              <Row label="Student"  value={result.studentName} />
              <Row label="Course"   value={result.courseName} />
              <Row label="Issued"   value={formatDate(result.issuedAt)} />
              <Row label="Code"     value={result.code} mono />
            </div>
            <div className="bg-emerald-50 px-4 pb-4">
              <button
                onClick={() => navigate(`/verify?code=${encodeURIComponent(result.code)}`)}
                className="w-full py-2 rounded-lg border-2 border-emerald-600 text-emerald-700 text-sm font-semibold hover:bg-emerald-100 transition flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                </svg>
                View Certificate
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function Row({ label, value, mono }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-xs font-bold text-gray-500 uppercase tracking-wide flex-shrink-0">{label}</span>
      <span className={`text-sm text-gray-800 text-right ${mono ? "font-mono font-semibold tracking-wider" : "font-medium"}`}>{value || "—"}</span>
    </div>
  );
}
