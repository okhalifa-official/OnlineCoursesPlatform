import { useNavigate } from "react-router-dom";
import { useLandingData } from "../../utils/LandingDataContext";
import useSiteContent from "../../hooks/useSiteContent";

export default function HeroSection() {
  const navigate = useNavigate();

  const data = useLandingData();
  const xmlHero = data?.hero || {};

  const { hero: cmsHero } = useSiteContent("landing");

  const badge =
    cmsHero?.subtitle ||
    xmlHero?.badge ||
    "Internationally Accredited POCUS";

  const headline =
    cmsHero?.title ||
    xmlHero?.headline ||
    "Hands-on Ultrasound Training for the Real Bedside.";

  const headlineHighlight = xmlHero?.headlineHighlight || "Training";

  const subheadline =
    cmsHero?.description ||
    xmlHero?.subheadline ||
    "Practical ultrasound learning designed for real clinical confidence.";

  const buttonText = cmsHero?.buttonText || "Browse Courses";
  const buttonLink = cmsHero?.buttonLink || "/courses";

  const stats = Array.isArray(xmlHero?.stats) ? xmlHero.stats : [];

  const ratingValue = xmlHero?.rating?.value || "4.9";
  const ratingReviews = xmlHero?.rating?.reviews || "120+";

  const workshopTitle =
    xmlHero?.workshopBadge?.title || "Live Workshops";

  const workshopSubtitle =
    xmlHero?.workshopBadge?.subtitle || "Hands-on clinical training";

  function renderHeadline() {
    if (cmsHero?.title) {
      return cmsHero.title;
    }

    if (
      xmlHero?.headline &&
      xmlHero?.headlineHighlight &&
      xmlHero.headline.includes(xmlHero.headlineHighlight)
    ) {
      const parts = xmlHero.headline.split(xmlHero.headlineHighlight);

      return (
        <>
          {parts[0]}
          <span className="text-brandRed">{xmlHero.headlineHighlight}</span>
          {parts[1]}
        </>
      );
    }

    return (
      <>
        Hands-on Ultrasound{" "}
        <span className="text-brandRed">{headlineHighlight}</span> for the Real
        Bedside.
      </>
    );
  }

  return (
    <section className="max-w-6xl mx-auto px-6 pt-16 pb-20 flex flex-col lg:flex-row items-center gap-12">
      <div className="flex-1 max-w-xl">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-1.5 h-4 bg-brandRed rounded-full" />

          <span className="text-brandRed text-xs font-bold uppercase tracking-widest">
            {badge}
          </span>
        </div>

        <h1
          className="font-heading font-black text-charcoal leading-tight mb-5"
          style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
        >
          {renderHeadline()}
        </h1>

        <p className="text-gray-500 text-base leading-relaxed mb-8 whitespace-pre-line">
          {subheadline}
        </p>

        <div className="flex items-center gap-4 mb-10">
          <button
            type="button"
            onClick={() => navigate(buttonLink)}
            className="flex items-center gap-2 bg-brandRed text-white font-semibold px-6 py-3 rounded-xl hover:bg-red-700 transition"
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

          <button
            type="button"
            className="flex items-center gap-2 text-charcoal font-semibold px-4 py-3 hover:text-brandRed transition"
          >
            <div className="w-9 h-9 rounded-full border-2 border-charcoal flex items-center justify-center">
              <svg
                className="w-3.5 h-3.5 ml-0.5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            Watch demo
          </button>
        </div>

        {stats.length > 0 && (
          <div className="flex items-center gap-8">
            {stats.map((stat) => (
              <div key={stat.label}>
                <p className="font-heading font-black text-charcoal text-2xl">
                  {stat.value}
                </p>

                <p className="text-gray-400 text-xs">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col items-end gap-4">
        <div className="flex items-center gap-2 self-center mb-1">
          <svg
            className="w-5 h-5 text-yellow-400"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>

          <span className="font-bold text-charcoal text-sm">
            {ratingValue} / 5
          </span>

          <span className="text-gray-400 text-xs">
            {ratingReviews} reviews
          </span>
        </div>

        <div className="w-full max-w-sm bg-softGrey rounded-2xl overflow-hidden border border-gray-100 aspect-video flex items-center justify-center relative">
          {cmsHero?.imageUrl ? (
            <img
              src={cmsHero.imageUrl}
              alt={cmsHero.title || "Hero"}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-gray-300 text-center">
              <svg
                className="w-16 h-16 mx-auto mb-2"
                fill="none"
                stroke="currentColor"
                strokeWidth={1}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>

              <p className="text-sm">Bedside scanning demo</p>
            </div>
          )}
        </div>

        <div className="bg-charcoal text-white rounded-xl px-4 py-3 text-xs self-end">
          <p className="font-semibold">{workshopTitle}</p>
          <p className="text-gray-400 mt-0.5">{workshopSubtitle}</p>
        </div>
      </div>
    </section>
  );
}