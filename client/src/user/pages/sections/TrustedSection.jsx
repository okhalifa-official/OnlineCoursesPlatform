import { useLandingData } from "../../utils/LandingDataContext";
import useSiteContent from "../../hooks/useSiteContent";

export default function TrustedSection() {
  const data = useLandingData();

  const xmlTrusted = Array.isArray(data?.trusted) ? data.trusted : [];

  const { getSection } = useSiteContent("landing");
  const cmsTrusted = getSection("trusted");

  const title =
    cmsTrusted?.subtitle ||
    cmsTrusted?.title ||
    "Trusted by clinicians at";

  const trustedList =
    Array.isArray(cmsTrusted?.items) && cmsTrusted.items.length > 0
      ? cmsTrusted.items
      : xmlTrusted;

  return (
    <section id="trusted" className="border-y border-gray-100 py-5 bg-white overflow-hidden">
      <div className="max-w-6xl mx-auto px-6">
        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest mb-4">
          {title}
        </p>

        <div className="flex flex-wrap gap-x-10 gap-y-2 items-center">
          {trustedList.map((item, index) => {
            const name =
              typeof item === "string"
                ? item
                : item.title || item.name || item.label || `Partner ${index + 1}`;

            return (
              <span
                key={`${name}-${index}`}
                className="text-gray-400 font-semibold text-sm"
              >
                {name}
              </span>
            );
          })}
        </div>
      </div>
    </section>
  );
}