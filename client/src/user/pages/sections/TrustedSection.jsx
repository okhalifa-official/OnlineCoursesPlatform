import { useLandingData } from "../../utils/LandingDataContext";

export default function TrustedSection() {
  const data = useLandingData();
  const trusted = data?.trusted ?? [];

  return (
    <section className="border-y border-gray-100 py-5 bg-white overflow-hidden">
      <div className="max-w-6xl mx-auto px-6">
        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest mb-4">
          Trusted by clinicians at
        </p>
        <div className="flex flex-wrap gap-x-10 gap-y-2 items-center">
          {trusted.map((name) => (
            <span key={name} className="text-gray-400 font-semibold text-sm">{name}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
