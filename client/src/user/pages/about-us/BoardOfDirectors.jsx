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
  const res  = await fetch("/data/board-of-directors.xml");
  const text = await res.text();
  const doc  = new DOMParser().parseFromString(text, "application/xml");
  return [...doc.querySelectorAll("member")].map((m) => ({
    name:        m.getAttribute("name"),
    title:       m.getAttribute("title"),
    institution: m.getAttribute("institution"),
    specialty:   m.getAttribute("specialty"),
    bio:         m.getAttribute("bio"),
  }));
}

export default function BoardOfDirectors() {
  const [members, setMembers] = useState([]);
  useEffect(() => { fetchData().then(setMembers); }, []);

  return (
    <div className="min-h-screen bg-white">
      <UserNavbar links={NAV_LINKS} />
      <div className="max-w-5xl mx-auto px-6 py-20">
        <p className="text-brandRed text-xs font-bold uppercase tracking-widest mb-3">Leadership</p>
        <h1 className="font-heading font-black text-charcoal mb-10" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
          Board of Directors
        </h1>

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
              {members.map((m, i) => (
                <tr key={m.name} className={`border-t border-gray-100 hover:bg-softGrey transition ${i % 2 === 0 ? "bg-white" : "bg-gray-50/40"}`}>
                  <td className="px-5 py-4 text-gray-300 font-medium">{i + 1}</td>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-charcoal">{m.name}</p>
                    <p className="text-gray-400 text-xs mt-0.5 md:hidden">{m.title}</p>
                    {m.bio && <p className="text-gray-400 text-xs mt-1 leading-relaxed hidden lg:block">{m.bio}</p>}
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
      </div>
    </div>
  );
}
