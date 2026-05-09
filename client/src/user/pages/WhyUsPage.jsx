// not used

import { useNavigate } from "react-router-dom";
import UserNavbar from "../components/UserNavbar";

// Four differentiating pillars — each has an accent colour for its icon bg.
const PILLARS = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: "#D62828",
    title: "Clinically precise",
    desc: "Every module is faculty-vetted and built around real bedside scenarios, not theory for its own sake. You practice the exact workflow you'll use on shift.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    color: "#1D4ED8",
    title: "Authoritative curriculum",
    desc: "Fully aligned with EFSUMB & WINFOCUS international standards — meaning your certificate is recognised globally, not just locally.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    color: "#065F46",
    title: "Confidence-building drills",
    desc: "Repeat-until-mastered simulation drills mean you've already scanned the scenario dozens of times before you face it on a real patient.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    color: "#7C3AED",
    title: "Physician-to-physician",
    desc: "Plain-language teaching from clinicians who still scan patients daily. No academic detachment — pure bedside knowledge transfer.",
  },
];

// Hero stats — shown in the four-column grid at the top.
const STATS = [
  { value: "12k+", label: "Physicians trained" },
  { value: "98%",  label: "Pass rate" },
  { value: "4.9",  label: "Average rating" },
  { value: "11",   label: "Specialised tracks" },
];

/**
 * /why-us — Static marketing page explaining the SonoSchool value proposition.
 *
 * Sections:
 *   1. Hero + stats row
 *   2. Four differentiating pillars grid
 *   3. Dark CTA strip → /courses and /register
 */
export default function WhyUsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">

      {/* ── 1. Hero ── */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-16 text-center">
        <p className="text-brandRed text-xs font-bold uppercase tracking-widest mb-3">
          Why SonoSchool
        </p>
        <h1 className="font-heading font-black text-charcoal leading-tight mx-auto mb-5"
          style={{ fontSize: "clamp(2rem, 4vw, 3rem)", maxWidth: "640px" }}>
          Built by clinicians,<br />for clinicians.
        </h1>
        <p className="text-gray-500 text-base leading-relaxed mx-auto mb-10" style={{ maxWidth: "540px" }}>
          Most ultrasound courses teach you to read images. We teach you to use ultrasound
          as a clinical tool — the way it's actually used at the bedside.
        </p>

        {/* Stats grid — 2×2 on mobile, 1×4 on md+ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
          {STATS.map((s) => (
            <div key={s.label} className="bg-softGrey rounded-2xl py-5 px-4">
              <p className="font-heading font-black text-charcoal text-2xl mb-1">{s.value}</p>
              <p className="text-gray-400 text-xs">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 2. Pillars ── */}
      <section className="bg-softGrey py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="font-heading font-black text-charcoal mb-10 text-center"
            style={{ fontSize: "clamp(1.5rem, 2.5vw, 1.875rem)" }}>
            Four things that set us apart
          </h2>
          {/* 2-column grid — each card has an icon with the pillar's accent colour */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PILLARS.map((p) => (
              <div key={p.title} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-card transition">
                {/* Icon square — background is the accent color at ~9% opacity */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: p.color + "18", color: p.color }}
                >
                  {p.icon}
                </div>
                <p className="font-heading font-bold text-charcoal mb-2">{p.title}</p>
                <p className="text-gray-400 text-sm leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. CTA ── */}
      <section className="bg-charcoal py-16 text-center">
        <h2 className="font-heading font-black text-white mb-4"
          style={{ fontSize: "clamp(1.5rem, 2.5vw, 2rem)" }}>
          See the difference for yourself.
        </h2>
        <p className="text-gray-400 text-sm mb-8 max-w-md mx-auto">
          Browse our course catalogue — no sign-up needed to explore.
        </p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => navigate("/courses")}
            className="bg-brandRed text-white font-semibold px-6 py-3 rounded-xl hover:bg-red-700 transition text-sm"
          >
            Browse courses
          </button>
          <button
            onClick={() => navigate("/register")}
            className="border border-white/20 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/10 transition text-sm"
          >
            Create account
          </button>
        </div>
      </section>
    </div>
  );
}
