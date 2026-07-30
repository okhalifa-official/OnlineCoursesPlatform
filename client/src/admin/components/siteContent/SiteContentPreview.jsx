import HeroSection from "../../../user/pages/sections/HeroSection";
import TrustedSection from "../../../user/pages/sections/TrustedSection";
import AboutSection from "../../../user/pages/sections/AboutSection";
import TracksSection from "../../../user/pages/sections/TracksSection";
import WhyUsSection from "../../../user/pages/sections/WhyUsSection";
import EventsSection from "../../../user/pages/sections/EventsSection";
import VerifySection from "../../../user/pages/sections/VerifySection";
import ContactSection from "../../../user/pages/sections/ContactSection";
import FooterCtaSection from "../../../user/pages/sections/FooterCtaSection";
import MissionVision from "../../../user/pages/about-us/MissionVision";
import BoardOfDirectors from "../../../user/pages/about-us/BoardOfDirectors";
import MENABoard from "../../../user/pages/about-us/MENABoard";
import ScientificCommittee from "../../../user/pages/about-us/ScientificCommittee";
import ClinicalAdvisors from "../../../user/pages/about-us/ClinicalAdvisors";
import BusinessPartners from "../../../user/pages/about-us/BusinessPartners";
import ScientificPartners from "../../../user/pages/about-us/ScientificPartners";
import Policies from "../../../user/pages/about-us/Policies";
import PreviewErrorBoundary from "./PreviewErrorBoundary";

function findSection(sections, key) {
  return (sections || []).find((s) => s.key === key) || null;
}

const ABOUT_PAGE_COMPONENTS = {
  "mission-vision": MissionVision,
  "board-of-directors": BoardOfDirectors,
  "mena-board": MENABoard,
  "scientific-committee": ScientificCommittee,
  "clinical-advisors": ClinicalAdvisors,
  "business-partners": BusinessPartners,
  "scientific-partners": ScientificPartners,
  policies: Policies,
};

export default function SiteContentPreview({ pageKey, hero, sections, pageData }) {
  const isLanding = pageKey === "landing";
  const AboutComponent = ABOUT_PAGE_COMPONENTS[pageKey];

  return (
    <div className="rounded-3xl bg-white border border-[#E5E5E5] shadow-card p-4">
      <p className="text-xs font-bold uppercase tracking-widest text-[#333333]/50 mb-3 px-2">
        Live Preview
      </p>

      <div className="rounded-2xl border border-[#DDDDDD] overflow-auto" style={{ maxHeight: "80vh" }}>
        <div style={{ width: "1024px", transform: "scale(0.62)", transformOrigin: "top left" }}>
          <PreviewErrorBoundary resetKey={pageKey}>
            {isLanding && (
              <div className="bg-white">
                <HeroSection previewOverride={{ hero }} />
                <TrustedSection previewOverride={findSection(sections, "trusted")} />
                <VerifySection previewOverride={findSection(sections, "verify")} />
                <AboutSection previewOverride={findSection(sections, "about")} />
                <TracksSection previewOverride={findSection(sections, "tracks")} />
                <WhyUsSection previewOverride={findSection(sections, "why-us")} />
                <EventsSection previewOverride={findSection(sections, "events")} />
                <ContactSection previewOverride={findSection(sections, "contact")} />
                <FooterCtaSection previewOverride={findSection(sections, "footer-cta")} />
              </div>
            )}

            {!isLanding && AboutComponent && (
              <AboutComponent previewOverride={pageData} />
            )}
          </PreviewErrorBoundary>
        </div>
      </div>
    </div>
  );
}
