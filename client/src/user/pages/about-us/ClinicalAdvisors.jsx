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
  const res  = await fetch("/data/clinical-advisors.xml");
  const text = await res.text();
  const doc  = new DOMParser().parseFromString(text, "application/xml");
  return [...doc.querySelectorAll("advisor")].map((a) => ({
    name:        a.getAttribute("name"),
    title:       a.getAttribute("title"),
    institution: a.getAttribute("institution"),
    specialty:   a.getAttribute("specialty"),
    expertise:   a.getAttribute("expertise"),
  }));
}

export default function ClinicalAdvisors() {
  const [advisors, setAdvisors] = useState([]);
  useEffect(() => { fetchData().then(setAdvisors); }, []);

  return (
    <div className="min-h-screen bg-white">
      <UserNavbar links={NAV_LINKS} />
      <div className="max-w-5xl mx-auto px-6 py-20">
        <p className="text-brandRed text-xs font-bold uppercase tracking-widest mb-3">Expert Panel</p>
        <h1 className="font-heading font-black text-charcoal mb-10" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
          Clinical Advisors
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
              {advisors.map((a, i) => (
                <tr key={a.name} className={`border-t border-gray-100 hover:bg-softGrey transition ${i % 2 === 0 ? "bg-white" : "bg-gray-50/40"}`}>
                  <td className="px-5 py-4 text-gray-300 font-medium">{i + 1}</td>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-charcoal">{a.name}</p>
                    <p className="text-gray-400 text-xs mt-0.5 md:hidden">{a.title}</p>
                    {a.expertise && <p className="text-gray-400 text-xs mt-1 leading-relaxed hidden lg:block">{a.expertise}</p>}
                  </td>
                  <td className="px-5 py-4 text-gray-500 hidden md:table-cell">{a.title}</td>
                  <td className="px-5 py-4 text-gray-500 hidden lg:table-cell">{a.institution}</td>
                  <td className="px-5 py-4 hidden sm:table-cell">
                    <span className="inline-block bg-brandRed/8 text-brandRed text-xs font-semibold px-2.5 py-1 rounded-lg">{a.specialty}</span>
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
