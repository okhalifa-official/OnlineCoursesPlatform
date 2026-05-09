import { useLandingData } from "../../utils/LandingDataContext";

export default function VerifySection() {
  const data = useLandingData();
  const verify = data?.verify;

  return (
    <section id="verify" className="bg-softGrey py-20">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <p className="text-brandRed text-xs font-bold uppercase tracking-widest mb-3">{verify?.eyebrow}</p>
        <h2 className="font-heading font-black text-charcoal mb-4" style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)" }}>
          {verify?.headline}
        </h2>
        <p className="text-gray-500 text-sm mb-8 max-w-md mx-auto">
          {verify?.body}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input
            type="text"
            placeholder={verify?.placeholder}
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-charcoal placeholder-gray-300 focus:outline-none focus:border-brandRed transition bg-white"
          />
          <button className="bg-brandRed text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-red-700 transition text-sm whitespace-nowrap">
            {verify?.buttonLabel}
          </button>
        </div>
      </div>
    </section>
  );
}
