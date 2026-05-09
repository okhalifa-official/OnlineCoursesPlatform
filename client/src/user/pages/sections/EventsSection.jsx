import { useLandingData } from "../../utils/LandingDataContext";

export default function EventsSection() {
  const data = useLandingData();
  const events = data?.events;

  return (
    <section id="events" className="bg-white py-20">
      <div className="max-w-6xl mx-auto px-6">
        <p className="text-brandRed text-xs font-bold uppercase tracking-widest mb-3">{events?.eyebrow}</p>
        <h2 className="font-heading font-black text-charcoal mb-10" style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)" }}>
          {events?.headline}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(events?.items ?? []).map((ev) => (
            <div key={ev.title} className="bg-softGrey rounded-2xl p-6 border border-gray-100 hover:shadow-card transition">
              <p className="font-heading font-bold text-charcoal mb-1">{ev.title}</p>
              <p className="text-gray-400 text-xs mb-3">{ev.date} · {ev.location}</p>
              <p className="text-brandRed text-xs font-semibold">{ev.seats} seats left</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
