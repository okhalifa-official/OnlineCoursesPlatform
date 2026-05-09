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

async function fetchCommittee() {
  const res  = await fetch("/data/scientific-committee.xml");
  const text = await res.text();
  const doc  = new DOMParser().parseFromString(text, "application/xml");

  return [...doc.querySelectorAll("country")].map((c) => ({
    country: c.getAttribute("name"),
    members: [...c.querySelectorAll("member")].map((m) => ({
      name:        m.getAttribute("name"),
      title:       m.getAttribute("title"),
      institution: m.getAttribute("institution"),
      specialty:   m.getAttribute("specialty"),
    })),
  }));
}

export default function ScientificCommittee() {
  const [groups, setGroups]   = useState([]);
  const [active, setActive]   = useState(null);

  useEffect(() => {
    fetchCommittee().then((data) => {
      setGroups(data);
      setActive(data[0]?.country ?? null);
    });
  }, []);

  const current = groups.find((g) => g.country === active);

  return (
    <div className="min-h-screen bg-white">
      <UserNavbar links={NAV_LINKS} />

      <div className="max-w-5xl mx-auto px-6 py-20">
        <p className="text-brandRed text-xs font-bold uppercase tracking-widest mb-3">Academic Oversight</p>
        <h1 className="font-heading font-black text-charcoal mb-10" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
          Scientific Committee
        </h1>

        {/* Country tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {groups.map((g) => (
            <button
              key={g.country}
              onClick={() => setActive(g.country)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition
                ${active === g.country
                  ? "bg-brandRed text-white border-brandRed"
                  : "bg-white text-charcoal border-gray-200 hover:border-brandRed hover:text-brandRed"
                }`}
            >
              {g.country}
              <span className={`ml-2 text-xs font-normal ${active === g.country ? "text-white/70" : "text-gray-400"}`}>
                {g.members.length}
              </span>
            </button>
          ))}
        </div>

        {/* Table */}
        {current && (
          <div className="border border-gray-100 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-softGrey text-left">
                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-widest text-gray-400 w-8">#</th>
                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-widest text-gray-400">Name</th>
                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-widest text-gray-400 hidden md:table-cell">Title</th>
                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-widest text-gray-400 hidden lg:table-cell">Institution</th>
                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-widest text-gray-400 hidden sm:table-cell">Specialty</th>
                </tr>
              </thead>
              <tbody>
                {current.members.map((m, i) => (
                  <tr
                    key={m.name}
                    className={`border-t border-gray-100 hover:bg-softGrey transition ${i % 2 === 0 ? "bg-white" : "bg-gray-50/40"}`}
                  >
                    <td className="px-5 py-4 text-gray-300 font-medium">{i + 1}</td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-charcoal">{m.name}</p>
                      <p className="text-gray-400 text-xs mt-0.5 md:hidden">{m.title}</p>
                    </td>
                    <td className="px-5 py-4 text-gray-500 hidden md:table-cell">{m.title}</td>
                    <td className="px-5 py-4 text-gray-500 hidden lg:table-cell">{m.institution}</td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <span className="inline-block bg-brandRed/8 text-brandRed text-xs font-semibold px-2.5 py-1 rounded-lg">
                        {m.specialty}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {groups.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-gray-300">
            <svg className="w-10 h-10 mb-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <p className="text-sm">Loading…</p>
          </div>
        )}
      </div>
    </div>
  );
}
