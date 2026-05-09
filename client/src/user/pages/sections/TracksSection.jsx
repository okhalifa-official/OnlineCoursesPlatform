import { useNavigate } from "react-router-dom";
import { useLandingData } from "../../utils/LandingDataContext";
import useSiteContent from "../../hooks/useSiteContent";

export default function TracksSection() {
  const navigate = useNavigate();

  const data = useLandingData();
  const xmlTracks = Array.isArray(data?.tracks) ? data.tracks : [];

  const { getSection } = useSiteContent("landing");
  const cmsTracks = getSection("tracks");

  const eyebrow =
    cmsTracks?.subtitle ||
    "What we offer";

  const headline =
    cmsTracks?.title ||
    `We deliver ${xmlTracks.length} specialised tracks`;

  const body =
    cmsTracks?.body ||
    "";

  const buttonText =
    cmsTracks?.buttonText ||
    "View all courses";

  const buttonLink =
    cmsTracks?.buttonLink ||
    "/courses";

  const tracks =
    Array.isArray(cmsTracks?.items) && cmsTracks.items.length > 0
      ? cmsTracks.items
      : xmlTracks;

  return (
    <section id="tracks" className="bg-softGrey py-20">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-end justify-between mb-8 gap-6">
          <div>
            <p className="text-brandRed text-xs font-bold uppercase tracking-widest mb-2">
              {eyebrow}
            </p>

            <h2
              className="font-heading font-black text-charcoal"
              style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)" }}
            >
              {headline}
            </h2>

            {body && (
              <p className="text-gray-500 text-sm leading-relaxed mt-4 max-w-2xl whitespace-pre-line">
                {body}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => navigate(buttonLink)}
            className="hidden sm:flex items-center gap-2 border border-gray-300 bg-white rounded-xl px-5 py-2.5 text-sm font-semibold text-charcoal hover:border-brandRed hover:text-brandRed transition"
          >
            {buttonText}

            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
              />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tracks.map((track, index) => {
            const label =
              track.label ||
              track.title ||
              `Track ${index + 1}`;

            const description =
              track.desc ||
              track.description ||
              track.body ||
              "";

            const color =
              track.color ||
              "#D62828";

            const link =
              track.buttonLink ||
              track.link ||
              buttonLink;

            return (
              <div
                key={`${label}-${index}`}
                className="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-card hover:-translate-y-0.5 transition-all duration-200 group cursor-pointer"
                onClick={() => navigate(link)}
              >
                <div
                  className="w-8 h-8 rounded-lg mb-4 flex items-center justify-center"
                  style={{ background: `${color}18` }}
                >
                  <div
                    className="w-3 h-3 rounded-sm"
                    style={{ background: color }}
                  />
                </div>

                <p className="font-heading font-bold text-charcoal text-sm mb-1">
                  {label}
                </p>

                <p className="text-gray-400 text-xs leading-relaxed mb-4">
                  {description}
                </p>

                <p className="text-xs font-semibold text-charcoal group-hover:text-brandRed transition flex items-center gap-1">
                  Explore track

                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                    />
                  </svg>
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}