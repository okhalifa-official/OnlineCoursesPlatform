// client/src/admin/pages/SiteContent.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getPageContentByKey,
  updatePageContent,
} from "../api/pageContentApi";
import SiteContentSidebar from "../components/siteContent/SiteContentSidebar";
import LandingEditor from "../components/siteContent/LandingEditor";
import AboutPageEditor from "../components/siteContent/AboutPageEditor";
import SiteContentPreview from "../components/siteContent/SiteContentPreview";
import { PAGE_NAV_GROUPS } from "../components/siteContent/aboutPageFieldDefs";

const emptyPage = {
  pageKey: "",
  pageName: "",
  title: "",
  description: "",
  hero: {
    title: "",
    subtitle: "",
    description: "",
    imageUrl: "",
    buttonText: "",
    buttonLink: "",
    videoUrl: "",
    headlineHighlight: "",
    rating: { value: 0, reviews: 0 },
    workshopBadge: { title: "", subtitle: "" },
    stats: [],
  },
  sections: [],
  pageData: {},
  isPublished: true,
};

function pageLabelFor(pageKey) {
  for (const group of PAGE_NAV_GROUPS) {
    const match = group.pages.find((p) => p.pageKey === pageKey);
    if (match) return match.label;
  }
  return pageKey;
}

export default function SiteContent() {
  const [selectedPageKey, setSelectedPageKey] = useState("landing");
  const [pageData, setPageData] = useState(emptyPage);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const isLanding = selectedPageKey === "landing";

  async function loadPage(pageKey) {
    try {
      setLoading(true);
      setError("");
      setNotice("");

      const data = await getPageContentByKey(pageKey);

      const safeData = {
        ...emptyPage,
        ...(data || {}),
        hero: {
          ...emptyPage.hero,
          ...(data?.hero || {}),
          rating: { ...emptyPage.hero.rating, ...(data?.hero?.rating || {}) },
          workshopBadge: {
            ...emptyPage.hero.workshopBadge,
            ...(data?.hero?.workshopBadge || {}),
          },
        },
        sections: Array.isArray(data?.sections) ? data.sections : [],
        pageData: data?.pageData || {},
      };

      setPageData(safeData);
    } catch (err) {
      setError(err.message || "Failed to load page content");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPage(selectedPageKey);
  }, [selectedPageKey]);

  async function handleSave() {
    try {
      setSaving(true);
      setError("");
      setNotice("");

      const payload = {
        ...pageData,
        pageKey: selectedPageKey,
        pageName: pageData.pageName || pageLabelFor(selectedPageKey),
      };

      const result = await updatePageContent(selectedPageKey, payload);

      setPageData((prev) => ({
        ...prev,
        ...(result.page || payload),
      }));

      setNotice("Page content saved successfully");
    } catch (err) {
      setError(err.message || "Failed to save page content");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F2F2F2] text-[#1A1A1A] p-8">
      <div className="max-w-[1600px] mx-auto">
        <header className="mb-8 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm font-semibold text-[#333333]/70 heading-font mb-2">
              Website Management
            </p>

            <h1 className="text-4xl font-extrabold heading-font">
              Site Content
            </h1>

            <p className="text-[#333333]/70 mt-2">
              Edit user-facing pages from the admin dashboard.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Link
              to="/dashboard"
              className="h-12 px-5 rounded-xl bg-[#1A1A1A] text-white text-sm font-bold heading-font flex items-center justify-center gap-2 hover:bg-black transition"
            >
              <span className="material-symbols-outlined text-[20px]">
                dashboard
              </span>
              Back to Dashboard
            </Link>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loading}
              className="h-12 px-6 rounded-xl bg-[#D62828] text-white text-sm font-bold heading-font hover:opacity-95 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </header>

        {notice && (
          <div className="mb-6 rounded-2xl bg-green-50 border border-green-200 text-green-700 px-5 py-4 text-sm font-semibold">
            {notice}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-2xl bg-red-50 border border-red-200 text-[#D62828] px-5 py-4 text-sm font-semibold">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-[240px_1fr_1fr] gap-6 items-start">
          <SiteContentSidebar selectedPageKey={selectedPageKey} onSelect={setSelectedPageKey} />

          <section className="rounded-3xl bg-white border border-[#E5E5E5] shadow-card p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-extrabold heading-font mb-1">
                {pageLabelFor(selectedPageKey)}
              </h2>

              <label className="flex items-center gap-3 mt-3">
                <input
                  type="checkbox"
                  checked={Boolean(pageData.isPublished)}
                  onChange={() =>
                    setPageData((prev) => ({
                      ...prev,
                      isPublished: !prev.isPublished,
                    }))
                  }
                  className="w-5 h-5 accent-[#D62828]"
                />
                <span className="text-sm font-bold heading-font">Published</span>
              </label>
            </div>

            {loading ? (
              <div className="p-10 text-center text-[#333333]/70">
                Loading page content...
              </div>
            ) : isLanding ? (
              <LandingEditor
                hero={pageData.hero}
                sections={pageData.sections}
                onHeroChange={(hero) => setPageData((prev) => ({ ...prev, hero }))}
                onSectionsChange={(sections) =>
                  setPageData((prev) => ({ ...prev, sections }))
                }
              />
            ) : (
              <AboutPageEditor
                pageKey={selectedPageKey}
                pageData={pageData.pageData}
                onChange={(data) =>
                  setPageData((prev) => ({ ...prev, pageData: data }))
                }
              />
            )}
          </section>

          {!loading && (
            <SiteContentPreview
              pageKey={selectedPageKey}
              hero={pageData.hero}
              sections={pageData.sections}
              pageData={pageData.pageData}
            />
          )}
        </div>
      </div>
    </main>
  );
}
