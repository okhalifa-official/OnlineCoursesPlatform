import { useNavigate } from "react-router-dom";
import { getUserToken } from "../../api/userApi";
import { useLandingData } from "../../utils/LandingDataContext";
import useSiteContent from "../../hooks/useSiteContent";

export default function FooterCtaSection() {
  const navigate = useNavigate();
  const isLoggedIn = !!getUserToken();

  const data = useLandingData();
  const xmlCta = data?.footerCta || {};

  const { getSection } = useSiteContent("landing");
  const cmsCta = getSection("footer-cta");

  const eyebrow =
    cmsCta?.subtitle ||
    xmlCta?.eyebrow ||
    "Start Learning";

  const headline =
    cmsCta?.title ||
    xmlCta?.headline ||
    "Ready to start your learning journey?";

  const body =
    cmsCta?.body ||
    xmlCta?.body ||
    "Create your account and explore professional learning paths with Sono School.";

  const buttonLabel =
    cmsCta?.buttonText ||
    xmlCta?.buttonLabel ||
    "Create Account";

  const buttonLink =
    cmsCta?.buttonLink ||
    "/register";

  return (
    <section className="bg-charcoal py-16 text-center">
      <p className="text-brandRed text-xs font-bold uppercase tracking-widest mb-3">
        {eyebrow}
      </p>

      <h2
        className="font-heading font-black text-white mb-4"
        style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)" }}
      >
        {headline}
      </h2>

      <p className="text-gray-400 text-sm mb-8 max-w-md mx-auto whitespace-pre-line">
        {body}
      </p>

      {!isLoggedIn && (
        <button
          type="button"
          onClick={() => navigate(buttonLink)}
          className="bg-brandRed text-white font-semibold px-8 py-3 rounded-xl hover:bg-red-700 transition"
        >
          {buttonLabel}
        </button>
      )}
    </section>
  );
}