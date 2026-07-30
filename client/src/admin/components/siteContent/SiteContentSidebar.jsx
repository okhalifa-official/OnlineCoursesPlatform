// client/src/admin/components/siteContent/SiteContentSidebar.jsx
import { PAGE_NAV_GROUPS } from "./aboutPageFieldDefs";

export default function SiteContentSidebar({ selectedPageKey, onSelect }) {
  return (
    <nav className="rounded-3xl bg-white border border-[#E5E5E5] shadow-card p-4 space-y-6">
      {PAGE_NAV_GROUPS.map((group) => (
        <div key={group.heading}>
          <p className="px-3 mb-2 text-xs font-bold uppercase tracking-widest text-[#333333]/50">
            {group.heading}
          </p>

          <div className="space-y-1">
            {group.pages.map((page) => {
              const isActive = page.pageKey === selectedPageKey;

              return (
                <button
                  key={page.pageKey}
                  type="button"
                  onClick={() => onSelect(page.pageKey)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                    isActive
                      ? "bg-[#D62828] text-white"
                      : "text-[#1A1A1A] hover:bg-[#F2F2F2]"
                  }`}
                >
                  {page.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
