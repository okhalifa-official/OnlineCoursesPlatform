import { useLandingData } from "../../utils/LandingDataContext";
import useSiteContent from "../../hooks/useSiteContent";

export default function WhyUsSection() {
  const data = useLandingData();

  const xmlWhyUs = data?.whyUs || {};

  const { getSection } = useSiteContent("landing");
  const cmsWhyUs = getSection("why-us");

  const eyebrow =
    cmsWhyUs?.subtitle ||
    xmlWhyUs?.eyebrow ||
    "Why Us";

  const headline =
    cmsWhyUs?.title ||
    xmlWhyUs?.headline ||
    "Why choose Sono School?";

  const body =
    cmsWhyUs?.body ||
    xmlWhyUs?.body ||
    "We provide practical, structured, and clinically focused learning experiences.";

  const stats =
    Array.isArray(cmsWhyUs?.items) && cmsWhyUs.items.length > 0
      ? cmsWhyUs.items.filter((item) => item.type === "stat" || item.value)
      : Array.isArray(xmlWhyUs?.stats)
      ? xmlWhyUs.stats
      : [];

  const pillarsHeading =
    cmsWhyUs?.buttonText ||
    xmlWhyUs?.pillarsHeading ||
    "Our learning pillars";

  const pillars =
    Array.isArray(cmsWhyUs?.items) && cmsWhyUs.items.length > 0
      ? cmsWhyUs.items.filter((item) => item.type === "pillar" || item.description || item.desc)
      : Array.isArray(xmlWhyUs?.pillars)
      ? xmlWhyUs.pillars
      : [];

  return (
    <section id="why-us" className="bg-white">
      <div className="max-w-6xl mx-auto px-6 pt-16 pb-16 text-center">
        <p className="text-brandRed text-xs font-bold uppercase tracking-widest mb-3">
          {eyebrow}
        </p>

        <h2
          className="font-heading font-black text-charcoal leading-tight mx-auto mb-5"
          style={{
            fontSize: "clamp(2rem, 4vw, 3rem)",
            maxWidth: "640px",
          }}
        >
          {headline}
        </h2>

        <p
          className="text-gray-500 text-base leading-relaxed mx-auto mb-10 whitespace-pre-line"
          style={{ maxWidth: "540px" }}
        >
          {body}
        </p>

        {stats.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
            {stats.map((stat, index) => {
              const value = stat.value || stat.number || "";
              const label = stat.label || stat.title || `Stat ${index + 1}`;

              return (
                <div
                  key={`${label}-${index}`}
                  className="bg-softGrey rounded-2xl py-5 px-4"
                >
                  <p className="font-heading font-black text-charcoal text-2xl mb-1">
                    {value}
                  </p>

                  <p className="text-gray-400 text-xs">
                    {label}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-softGrey py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2
            className="font-heading font-black text-charcoal mb-10 text-center"
            style={{ fontSize: "clamp(1.5rem, 2.5vw, 1.875rem)" }}
          >
            {pillarsHeading}
          </h2>

          {pillars.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pillars.map((pillar, index) => {
                const title = pillar.title || `Pillar ${index + 1}`;
                const description =
                  pillar.desc ||
                  pillar.description ||
                  pillar.body ||
                  "";

                const color = pillar.color || "#D62828";

                return (
                  <div
                    key={`${title}-${index}`}
                    className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-card transition"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                      style={{
                        background: `${color}18`,
                        color,
                      }}
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.8}
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>

                    <p className="font-heading font-bold text-charcoal mb-2">
                      {title}
                    </p>

                    <p className="text-gray-400 text-sm leading-relaxed">
                      {description}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}