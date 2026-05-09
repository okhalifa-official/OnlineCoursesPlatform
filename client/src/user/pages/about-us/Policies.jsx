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
  const res  = await fetch("/data/policies.xml");
  const text = await res.text();
  const doc  = new DOMParser().parseFromString(text, "application/xml");
  return [...doc.querySelectorAll("policy")].map((p) => ({
    title:   p.getAttribute("title"),
    slug:    p.getAttribute("slug"),
    updated: p.querySelector("lastUpdated")?.textContent?.trim() ?? "",
    sections: [...p.querySelectorAll("section")].map((s) => ({
      heading: s.getAttribute("heading"),
      body:    s.textContent.trim(),
    })),
  }));
}

export default function Policies() {
  const [policies, setPolicies] = useState([]);
  const [active, setActive]     = useState(null);
  useEffect(() => {
    fetchData().then((data) => { setPolicies(data); setActive(data[0]?.slug ?? null); });
  }, []);

  const current = policies.find((p) => p.slug === active);

  return (
    <div className="min-h-screen bg-white">
      <UserNavbar links={NAV_LINKS} />
      <div className="max-w-4xl mx-auto px-6 py-20">
        <p className="text-brandRed text-xs font-bold uppercase tracking-widest mb-3">Legal</p>
        <h1 className="font-heading font-black text-charcoal mb-10" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
          Policies
        </h1>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar — policy list */}
          <div className="md:w-56 shrink-0 flex flex-col gap-1">
            {policies.map((p) => (
              <button
                key={p.slug}
                onClick={() => setActive(p.slug)}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition
                  ${active === p.slug
                    ? "bg-brandRed text-white"
                    : "text-charcoal hover:bg-softGrey hover:text-brandRed"
                  }`}
              >
                {p.title}
              </button>
            ))}
          </div>

          {/* Content panel */}
          {current && (
            <div className="flex-1 border border-gray-100 rounded-2xl p-8">
              <div className="flex items-start justify-between mb-8">
                <h2 className="font-heading font-black text-charcoal text-xl">{current.title}</h2>
                {current.updated && (
                  <span className="text-xs text-gray-400 shrink-0 ml-4">Last updated: {current.updated}</span>
                )}
              </div>
              <div className="flex flex-col gap-7">
                {current.sections.map((s) => (
                  <div key={s.heading}>
                    <p className="font-semibold text-charcoal text-sm mb-2">{s.heading}</p>
                    <p className="text-gray-500 text-sm leading-relaxed">{s.body}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
