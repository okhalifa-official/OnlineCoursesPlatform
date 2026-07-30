import UserNavbar from "../../components/UserNavbar";
import useSiteContent from "../../hooks/useSiteContent";

const NAV_LINKS = [
  { label: "Home",    to: "/",         section: null      },
  { label: "Verify",  to: "/#verify",  section: "verify"  },
  { label: "Courses", to: "/courses",  section: null      },
  { label: "Why Us",  to: "/#why-us",  section: "why-us"  },
  { label: "Events",  to: "/#events",  section: "events"  },
  { label: "Contact", to: "/#contact", section: "contact" },
];

export default function MissionVision({ previewOverride } = {}) {
  const { content } = useSiteContent("mission-vision");
  const pageData = previewOverride ?? content?.pageData;
  const mission = pageData?.mission || { eyebrow: "Our Mission", body: "" };
  const vision = pageData?.vision || { eyebrow: "Our Vision", body: "" };
  const values = pageData?.values || [];

  return (
    <div className="min-h-screen bg-white">
      <UserNavbar links={NAV_LINKS} />
      <div className="max-w-4xl mx-auto px-6 py-20">
        <p className="text-brandRed text-xs font-bold uppercase tracking-widest mb-3">About SonoSchool</p>
        <h1 className="font-heading font-black text-charcoal mb-10" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
          Mission &amp; Vision
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-14">
          {[mission, vision].map((block) => block && (
            <div key={block.eyebrow} className="bg-softGrey rounded-2xl p-8">
              <p className="text-brandRed text-xs font-bold uppercase tracking-widest mb-3">{block.eyebrow}</p>
              <p className="text-gray-500 text-sm leading-relaxed">{block.body}</p>
            </div>
          ))}
        </div>

        {values.length > 0 && (
          <>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-6">Our Values</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {values.map((v) => (
                <div key={v.title} className="flex items-start gap-3">
                  <div className="mt-0.5 w-4 h-4 rounded-full bg-brandRed/10 flex items-center justify-center shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-brandRed" />
                  </div>
                  <div>
                    <p className="font-semibold text-charcoal text-sm mb-0.5">{v.title}</p>
                    <p className="text-gray-400 text-sm leading-relaxed">{v.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
