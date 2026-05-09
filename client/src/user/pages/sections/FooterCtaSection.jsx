import { useNavigate } from "react-router-dom";
import { getUserToken } from "../../api/userApi";
import { useLandingData } from "../../utils/LandingDataContext";

export default function FooterCtaSection() {
  const navigate = useNavigate();
  const isLoggedIn = !!getUserToken();
  const data = useLandingData();
  const cta = data?.footerCta;

  return (
    <section className="bg-charcoal py-16 text-center">
      <p className="text-brandRed text-xs font-bold uppercase tracking-widest mb-3">
        {cta?.eyebrow}
      </p>
      <h2 className="font-heading font-black text-white mb-4" style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)" }}>
        {cta?.headline}
      </h2>
      <p className="text-gray-400 text-sm mb-8 max-w-md mx-auto">
        {cta?.body}
      </p>
      {!isLoggedIn && (
        <button
          onClick={() => navigate("/register")}
          className="bg-brandRed text-white font-semibold px-8 py-3 rounded-xl hover:bg-red-700 transition"
        >
          {cta?.buttonLabel}
        </button>
      )}
    </section>
  );
}
