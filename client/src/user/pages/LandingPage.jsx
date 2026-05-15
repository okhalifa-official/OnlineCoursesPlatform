import UserNavbar from "../components/UserNavbar";
import usePageTitle from "../hooks/usePageTitle";
import { LandingDataProvider } from "../utils/LandingDataContext";
import HeroSection      from "./sections/HeroSection";
import TrustedSection   from "./sections/TrustedSection";
import AboutSection     from "./sections/AboutSection";
import TracksSection    from "./sections/TracksSection";
import WhyUsSection     from "./sections/WhyUsSection";
import EventsSection    from "./sections/EventsSection";
import VerifySection    from "./sections/VerifySection";
import ContactSection   from "./sections/ContactSection";
import FooterCtaSection from "./sections/FooterCtaSection";

const NAV_LINKS = [
  { label: "Home",    to: "/",         section: null      },
  { label: "Verify",  to: "/#verify",  section: "verify"  },
  { label: "Courses", to: "/courses",  section: null      },
  { label: "Why Us",  to: "/#why-us",  section: "why-us"  },
  { label: "Events",  to: "/#events",  section: "events"  },
  { label: "Contact", to: "/#contact", section: "contact" },
];

export default function LandingPage() {
  usePageTitle(null);
  return (
    <LandingDataProvider>
      <div className="min-h-screen bg-white">
        <UserNavbar links={NAV_LINKS} />

        <HeroSection />
        <TrustedSection />
        <VerifySection />
        <AboutSection />
        <TracksSection />
        <WhyUsSection />
        <EventsSection />
        <ContactSection />
        <FooterCtaSection />
      </div>
    </LandingDataProvider>
  );
}
