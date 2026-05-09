import { useLandingData } from "../../utils/LandingDataContext";

export default function AboutSection() {
  const data = useLandingData();
  const about = data?.about;

  return (
    <section className="max-w-6xl mx-auto px-6 py-20 flex flex-col lg:flex-row gap-16 items-center">
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
          {about?.eyebrow}
        </p>
        <h2 className="font-heading font-black text-charcoal leading-tight mb-5" style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)" }}>
          {about?.headline}
        </h2>
        <p className="text-gray-500 text-sm leading-relaxed mb-8">
          {about?.body}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {(about?.features ?? []).map((f) => (
            <div key={f.title} className="flex items-start gap-3">
              <div className="mt-0.5 w-4 h-4 rounded-full bg-brandRed/10 flex items-center justify-center shrink-0">
                <div className="w-1.5 h-1.5 rounded-full bg-brandRed" />
              </div>
              <div>
                <p className="font-semibold text-charcoal text-sm mb-0.5">{f.title}</p>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
