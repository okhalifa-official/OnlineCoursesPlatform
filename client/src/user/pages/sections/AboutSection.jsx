import { useLandingData } from "../../utils/LandingDataContext";
import useSiteContent from "../../hooks/useSiteContent";

export default function AboutSection() {
  const data = useLandingData();

  const xmlAbout = data?.about || {};

  const { getSection } = useSiteContent("landing");
  const cmsAbout = getSection("about");

  const eyebrow =
    cmsAbout?.subtitle ||
    xmlAbout?.eyebrow ||
    "About Us";

  const headline =
    cmsAbout?.title ||
    xmlAbout?.headline ||
    "About Sono School";

  const body =
    cmsAbout?.body ||
    xmlAbout?.body ||
    "Sono School is a professional learning platform built for practical medical education.";

  const imageUrl = cmsAbout?.imageUrl || "";

  const features =
    Array.isArray(cmsAbout?.items) && cmsAbout.items.length > 0
      ? cmsAbout.items
      : Array.isArray(xmlAbout?.features)
      ? xmlAbout.features
      : [];

  return (
    <section
      id="about"
      className="max-w-6xl mx-auto px-6 py-20 flex flex-col lg:flex-row gap-16 items-center"
    >
      <div className="w-full max-w-xs lg:max-w-sm bg-softGrey rounded-2xl aspect-square flex items-center justify-center border border-gray-100 shrink-0 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={headline}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-center text-gray-300">
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
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>

            <p className="text-sm">Scan training picture</p>
          </div>
        )}
      </div>

      <div className="flex-1">
        <p className="text-brandRed text-xs font-bold uppercase tracking-widest mb-3">
          {eyebrow}
        </p>

        <h2
          className="font-heading font-black text-charcoal leading-tight mb-5"
          style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)" }}
        >
          {headline}
        </h2>

        <p className="text-gray-500 text-sm leading-relaxed mb-8 whitespace-pre-line">
          {body}
        </p>

        {features.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {features.map((feature, index) => {
              const title = feature.title || `Feature ${index + 1}`;
              const description =
                feature.desc ||
                feature.description ||
                feature.body ||
                "";

              return (
                <div key={`${title}-${index}`} className="flex items-start gap-3">
                  <div className="mt-0.5 w-4 h-4 rounded-full bg-brandRed/10 flex items-center justify-center shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-brandRed" />
                  </div>

                  <div>
                    <p className="font-semibold text-charcoal text-sm mb-0.5">
                      {title}
                    </p>

                    <p className="text-gray-400 text-sm leading-relaxed">
                      {description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}