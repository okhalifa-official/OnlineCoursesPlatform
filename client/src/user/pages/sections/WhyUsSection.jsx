import { useLandingData } from "../../utils/LandingDataContext";

export default function WhyUsSection() {
  const data = useLandingData();
  const w = data?.whyUs;

  return (
    <section id="why-us" className="bg-white">
      <div className="max-w-6xl mx-auto px-6 pt-16 pb-16 text-center">
        <p className="text-brandRed text-xs font-bold uppercase tracking-widest mb-3">{w?.eyebrow}</p>
        <h2 className="font-heading font-black text-charcoal leading-tight mx-auto mb-5" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", maxWidth: "640px" }}>
          {w?.headline}
        </h2>
        <p className="text-gray-500 text-base leading-relaxed mx-auto mb-10" style={{ maxWidth: "540px" }}>
          {w?.body}
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
          {(w?.stats ?? []).map((s) => (
            <div key={s.label} className="bg-softGrey rounded-2xl py-5 px-4">
              <p className="font-heading font-black text-charcoal text-2xl mb-1">{s.value}</p>
              <p className="text-gray-400 text-xs">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-softGrey py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="font-heading font-black text-charcoal mb-10 text-center" style={{ fontSize: "clamp(1.5rem, 2.5vw, 1.875rem)" }}>
            {w?.pillarsHeading}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(w?.pillars ?? []).map((p) => (
              <div key={p.title} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-card transition">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: p.color + "18", color: p.color }}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="font-heading font-bold text-charcoal mb-2">{p.title}</p>
                <p className="text-gray-400 text-sm leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
