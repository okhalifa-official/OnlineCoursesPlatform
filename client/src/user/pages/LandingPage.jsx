import { useNavigate } from "react-router-dom";
import UserNavbar from "../components/UserNavbar";

// Centre nav links — shared across all public pages.
const NAV_LINKS = [
  { label: "Home",    to: "/" },
  { label: "Courses", to: "/courses" },
  { label: "Why Us",  to: "/why-us" },
  { label: "Events",  to: "/" },
  { label: "Verify",  to: "/" },
  { label: "Contact", to: "/" },
];

// The six track cards shown in the "What we offer" grid.
const TRACKS = [
  { color: "#1D4ED8", label: "Basic POCUS",        desc: "Foundations: cardiac, lung, abdomen, FAST" },
  { color: "#D62828", label: "Critical Care ECHO",  desc: "Haemodynamic assessment in the unstable patient" },
  { color: "#065F46", label: "Nerve Block US",      desc: "Image-guided regional anaesthesia from forearm to axilla" },
  { color: "#7C3AED", label: "Obstetrics POCUS",    desc: "First-trimester assessment and beyond" },
  { color: "#B45309", label: "Pediatric POCUS",     desc: "Adapted protocols for neonates and children" },
  { color: "#374151", label: "Instructor POCUS",    desc: "Train the trainer: facilitation and feedback skills" },
];

// Institution names in the "Trusted by" ticker bar.
const TRUSTED = ["Mayo Clinic", "Charité", "AUC Hospitals", "Cleveland", "Hamad Med", "Aga Khan", "EFSUMB"];

// Four value-proposition pillars in the About section.
const FEATURES = [
  { title: "Clinically precise",    desc: "Faculty-vetted modules built around real bedside scenarios." },
  { title: "Authoritative",         desc: "Aligned with EFSUMB & WINFOCUS standards." },
  { title: "Confidence-building",   desc: "Repeat until mastered drills before you scan a patient." },
  { title: "Approachable",          desc: "Plain-language teaching from physicians, for physicians." },
];

// Hero social-proof numbers.
const STATS = [
  { value: "12k+", label: "physicians trained" },
  { value: "98%",  label: "pass rate" },
  { value: "11",   label: "specialised tracks" },
];

/**
 * / — Public landing page.
 *
 * Sections (top to bottom):
 *   1. Hero       — headline, CTA buttons, stats row, preview card, workshop badge
 *   2. Trusted by — scrolling institution names
 *   3. About      — placeholder image + four feature pillars
 *   4. Tracks     — 6-card grid of specialised learning tracks
 *   5. Footer CTA — dark strip with Get started button → /register
 */
export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      <UserNavbar links={NAV_LINKS} />

      {/* ── 1. Hero ── */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-20 flex flex-col lg:flex-row items-center gap-12">
        {/* Left — headline + CTAs + stats */}
        <div className="flex-1 max-w-xl">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1.5 h-4 bg-brandRed rounded-full" />
            <span className="text-brandRed text-xs font-bold uppercase tracking-widest">
              Internationally Accredited POCUS
            </span>
          </div>

          <h1 className="font-heading font-black text-charcoal leading-tight mb-5" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
            Hands-on Ultrasound{" "}
            <span className="text-brandRed">Training</span>{" "}
            for the Real Bedside.
          </h1>

          <p className="text-gray-500 text-base leading-relaxed mb-8">
            Internationally accepted Point-of-Care Ultrasound education that empowers
            physicians to apply ultrasound confidently and accurately in their daily clinical practice.
          </p>

          <div className="flex items-center gap-4 mb-10">
            <button
              onClick={() => navigate("/courses")}
              className="flex items-center gap-2 bg-brandRed text-white font-semibold px-6 py-3 rounded-xl hover:bg-red-700 transition"
            >
              Browse courses
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
            {/* "Watch demo" — placeholder, no video wired up yet */}
            <button className="flex items-center gap-2 text-charcoal font-semibold px-4 py-3 hover:text-brandRed transition">
              <div className="w-9 h-9 rounded-full border-2 border-charcoal flex items-center justify-center">
                <svg className="w-3.5 h-3.5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              Watch demo
            </button>
          </div>

          {/* Social proof numbers */}
          <div className="flex items-center gap-8">
            {STATS.map((s) => (
              <div key={s.label}>
                <p className="font-heading font-black text-charcoal text-2xl">{s.value}</p>
                <p className="text-gray-400 text-xs">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right — rating badge + video placeholder + workshop badge */}
        <div className="flex-1 flex flex-col items-end gap-4">
          <div className="flex items-center gap-2 self-center mb-1">
            <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <span className="font-bold text-charcoal text-sm">4.9 / 5</span>
            <span className="text-gray-400 text-xs">2,140 reviews</span>
          </div>

          {/* Video placeholder — replace with an actual <video> or <iframe> when ready */}
          <div className="w-full max-w-sm bg-softGrey rounded-2xl overflow-hidden border border-gray-100 aspect-video flex items-center justify-center relative">
            <div className="text-gray-300 text-center">
              <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <p className="text-sm">Bedside scanning demo</p>
            </div>
          </div>

          {/* Floating urgency card — hardcoded until event data is dynamic */}
          <div className="bg-charcoal text-white rounded-xl px-4 py-3 text-xs self-end">
            <p className="font-semibold">Live workshop · Cairo</p>
            <p className="text-gray-400 mt-0.5">Next session — May 21 · 14 seats left</p>
          </div>
        </div>
      </section>

      {/* ── 2. Trusted by ── */}
      <section className="border-y border-gray-100 py-5 bg-white overflow-hidden">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest mb-4">
            Trusted by clinicians at
          </p>
          <div className="flex flex-wrap gap-x-10 gap-y-2 items-center">
            {TRUSTED.map((name) => (
              <span key={name} className="text-gray-400 font-semibold text-sm">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. About ── */}
      <section className="max-w-6xl mx-auto px-6 py-20 flex flex-col lg:flex-row gap-16 items-center">
        {/* Image placeholder — swap for a real photo when available */}
        <div className="w-full max-w-xs lg:max-w-sm bg-softGrey rounded-2xl aspect-square flex items-center justify-center border border-gray-100 shrink-0">
          <div className="text-center text-gray-300">
            <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm">Scan training picture</p>
          </div>
        </div>

        <div className="flex-1">
          <p className="text-brandRed text-xs font-bold uppercase tracking-widest mb-3">
            About SonoSchool
          </p>
          <h2 className="font-heading font-black text-charcoal leading-tight mb-5" style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)" }}>
            A modern, practical approach<br />to bedside ultrasound.
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-8">
            We deliver Point-of-Care Ultrasound education in a modern, practical, and impactful
            way — creating a measurable difference in patient care and taking ultrasound education
            beyond today's limits.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {FEATURES.map((f) => (
              <div key={f.title}>
                <p className="font-semibold text-charcoal text-sm mb-1">{f.title}</p>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. Tracks ── */}
      <section className="bg-softGrey py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-brandRed text-xs font-bold uppercase tracking-widest mb-2">
                What we offer
              </p>
              <h2 className="font-heading font-black text-charcoal" style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)" }}>
                Eleven specialised tracks
              </h2>
            </div>
            <button
              onClick={() => navigate("/courses")}
              className="hidden sm:flex items-center gap-2 border border-gray-300 bg-white rounded-xl px-5 py-2.5 text-sm font-semibold text-charcoal hover:border-brandRed hover:text-brandRed transition"
            >
              View all courses
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TRACKS.map((track) => (
              // Each track card navigates to the full courses list — deep-linking
              // to a filtered view can be added later.
              <div
                key={track.label}
                className="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-card hover:-translate-y-0.5 transition-all duration-200 group cursor-pointer"
                onClick={() => navigate("/courses")}
              >
                {/* Coloured dot icon — track color at 9% opacity for the bg */}
                <div
                  className="w-8 h-8 rounded-lg mb-4 flex items-center justify-center"
                  style={{ background: track.color + "18" }}
                >
                  <div className="w-3 h-3 rounded-sm" style={{ background: track.color }} />
                </div>
                <p className="font-heading font-bold text-charcoal text-sm mb-1">{track.label}</p>
                <p className="text-gray-400 text-xs leading-relaxed mb-4">{track.desc}</p>
                <p className="text-xs font-semibold text-charcoal group-hover:text-brandRed transition flex items-center gap-1">
                  Explore track
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. Footer CTA ── */}
      <section className="bg-charcoal py-16 text-center">
        <p className="text-brandRed text-xs font-bold uppercase tracking-widest mb-3">
          Start today
        </p>
        <h2 className="font-heading font-black text-white mb-4" style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)" }}>
          Ready to scan with confidence?
        </h2>
        <p className="text-gray-400 text-sm mb-8 max-w-md mx-auto">
          Join thousands of clinicians who've made POCUS part of their everyday practice.
        </p>
        <button
          onClick={() => navigate("/register")}
          className="bg-brandRed text-white font-semibold px-8 py-3 rounded-xl hover:bg-red-700 transition"
        >
          Get started — it's free
        </button>
      </section>
    </div>
  );
}
