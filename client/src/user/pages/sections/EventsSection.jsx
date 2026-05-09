import { useLandingData } from "../../utils/LandingDataContext";
import useSiteContent from "../../hooks/useSiteContent";

export default function EventsSection() {
  const data = useLandingData();

  const xmlEvents = data?.events || {};

  const { getSection } = useSiteContent("landing");
  const cmsEvents = getSection("events");

  const eyebrow =
    cmsEvents?.subtitle ||
    xmlEvents?.eyebrow ||
    "Events";

  const headline =
    cmsEvents?.title ||
    xmlEvents?.headline ||
    "Upcoming Events";

  const body =
    cmsEvents?.body ||
    "";

  const eventsList =
    Array.isArray(cmsEvents?.items) && cmsEvents.items.length > 0
      ? cmsEvents.items
      : Array.isArray(xmlEvents?.items)
      ? xmlEvents.items
      : [];

  return (
    <section id="events" className="bg-white py-20">
      <div className="max-w-6xl mx-auto px-6">
        <p className="text-brandRed text-xs font-bold uppercase tracking-widest mb-3">
          {eyebrow}
        </p>

        <h2
          className="font-heading font-black text-charcoal mb-5"
          style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)" }}
        >
          {headline}
        </h2>

        {body && (
          <p className="text-gray-500 text-sm leading-relaxed mb-10 max-w-2xl whitespace-pre-line">
            {body}
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {eventsList.map((event, index) => {
            const title = event.title || `Event ${index + 1}`;
            const date = event.date || event.subtitle || "Date TBA";
            const location = event.location || "Location TBA";
            const seats = event.seats || event.seatsLeft || "";
            const description =
              event.description ||
              event.body ||
              "";

            return (
              <div
                key={`${title}-${index}`}
                className="bg-softGrey rounded-2xl p-6 border border-gray-100 hover:shadow-card transition"
              >
                <p className="font-heading font-bold text-charcoal mb-1">
                  {title}
                </p>

                <p className="text-gray-400 text-xs mb-3">
                  {date} · {location}
                </p>

                {description && (
                  <p className="text-gray-500 text-sm leading-relaxed mb-3">
                    {description}
                  </p>
                )}

                {seats && (
                  <p className="text-brandRed text-xs font-semibold">
                    {seats} seats left
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}