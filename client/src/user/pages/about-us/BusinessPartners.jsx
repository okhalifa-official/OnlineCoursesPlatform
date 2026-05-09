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

const TYPE_COLORS = {
  Equipment:    "#1D4ED8",
  Distribution: "#065F46",
  Education:    "#7C3AED",
  Healthcare:   "#D62828",
  Technology:   "#0E7490",
  default:      "#374151",
};

async function fetchData() {
  const res  = await fetch("/data/business-partners.xml");
  const text = await res.text();
  const doc  = new DOMParser().parseFromString(text, "application/xml");
  return [...doc.querySelectorAll("partner")].map((p) => ({
    name:    p.getAttribute("name"),
    country: p.getAttribute("country"),
    type:    p.getAttribute("type"),
    website: p.getAttribute("website"),
    desc:    p.getAttribute("desc"),
  }));
}

export default function BusinessPartners() {
  const [partners, setPartners] = useState([]);
  const [active, setActive]     = useState("All");
  useEffect(() => { fetchData().then(setPartners); }, []);

  const types   = ["All", ...Array.from(new Set(partners.map((p) => p.type)))];
  const visible = active === "All" ? partners : partners.filter((p) => p.type === active);

  return (
    <div className="min-h-screen bg-white">
      <UserNavbar links={NAV_LINKS} />
      <div className="max-w-5xl mx-auto px-6 py-20">
        <p className="text-brandRed text-xs font-bold uppercase tracking-widest mb-3">Partnerships</p>
        <h1 className="font-heading font-black text-charcoal mb-10" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
          Business Partners
        </h1>

        {/* Type tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setActive(t)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition
                ${active === t
                  ? "bg-brandRed text-white border-brandRed"
                  : "bg-white text-charcoal border-gray-200 hover:border-brandRed hover:text-brandRed"
                }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="border border-gray-100 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-softGrey text-left">
                <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-widest text-gray-400 w-8">#</th>
                <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-widest text-gray-400">Partner</th>
                <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-widest text-gray-400 hidden sm:table-cell">Type</th>
                <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-widest text-gray-400 hidden md:table-cell">Country</th>
                <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-widest text-gray-400 hidden lg:table-cell">About</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((p, i) => {
                const color = TYPE_COLORS[p.type] ?? TYPE_COLORS.default;
                return (
                  <tr key={p.name} className={`border-t border-gray-100 hover:bg-softGrey transition ${i % 2 === 0 ? "bg-white" : "bg-gray-50/40"}`}>
                    <td className="px-5 py-4 text-gray-300 font-medium">{i + 1}</td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-charcoal">{p.name}</p>
                      {p.website && (
                        <a href={p.website} target="_blank" rel="noreferrer" className="text-xs text-brandRed hover:underline mt-0.5 inline-block">
                          {p.website.replace(/^https?:\/\//, "")}
                        </a>
                      )}
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ background: color + "18", color }}>
                        {p.type}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-500 hidden md:table-cell">{p.country}</td>
                    <td className="px-5 py-4 text-gray-400 text-xs leading-relaxed hidden lg:table-cell max-w-xs">{p.desc}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
