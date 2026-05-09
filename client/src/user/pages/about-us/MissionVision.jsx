import { useEffect, useState } from "react";
import UserNavbar from "../../components/UserNavbar";

const NAV_LINKS = [
  { label: "Home",    to: "/",         section: null      },
  { label: "Verify",  to: "/#verify",  section: "verify"  },
  { label: "Courses", to: "/courses",  section: null      },
  { label: "Why Us",  to: "/#why-us",  section: "why-us"  },
  { label: "Events",  to: "/#events",  section: "events"  },
  { label: "Contact", to: "/#contact", section: "contact" },
];

async function fetchData() {
  const res  = await fetch("/data/mission-vision.xml");
  const text = await res.text();
  const doc  = new DOMParser().parseFromString(text, "application/xml");
  const t    = (tag) => doc.querySelector(tag)?.textContent?.trim() ?? "";
  const els  = (tag) => [...doc.querySelectorAll(tag)];
  return {
    mission: { eyebrow: t("mission eyebrow"), body: t("mission body") },
    vision:  { eyebrow: t("vision eyebrow"),  body: t("vision body")  },
    values:  els("value").map((v) => ({ title: v.getAttribute("title"), desc: v.getAttribute("desc") })),
  };
}

export default function MissionVision() {
  const [data, setData] = useState(null);
  useEffect(() => { fetchData().then(setData); }, []);

  return (
    <div className="min-h-screen bg-white">
      <UserNavbar links={NAV_LINKS} />
      <div className="max-w-4xl mx-auto px-6 py-20">
        <p className="text-brandRed text-xs font-bold uppercase tracking-widest mb-3">About SonoSchool</p>
        <h1 className="font-heading font-black text-charcoal mb-10" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
          Mission &amp; Vision
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-14">
          {[data?.mission, data?.vision].map((block) => block && (
            <div key={block.eyebrow} className="bg-softGrey rounded-2xl p-8">
              <p className="text-brandRed text-xs font-bold uppercase tracking-widest mb-3">{block.eyebrow}</p>
              <p className="text-gray-500 text-sm leading-relaxed">{block.body}</p>
            </div>
          ))}
        </div>

        {(data?.values ?? []).length > 0 && (
          <>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-6">Our Values</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {data.values.map((v) => (
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
