import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  getPageContentByKey,
  getPageContentMeta,
  updatePageContent,
} from "../api/pageContentApi";

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
  },
  sections: [],
  isPublished: true,
};

const defaultSectionsJson = `[
  {
    "key": "main",
    "title": "",
    "subtitle": "",
    "body": "",
    "imageUrl": "",
    "buttonText": "",
    "buttonLink": "",
    "items": []
  }
]`;

export default function SiteContent() {
  const [pages, setPages] = useState([]);
  const [selectedPageKey, setSelectedPageKey] = useState("landing");
  const [pageData, setPageData] = useState(emptyPage);
  const [sectionsJson, setSectionsJson] = useState(defaultSectionsJson);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const selectedPageName = useMemo(() => {
    return (
      pages.find((page) => page.pageKey === selectedPageKey)?.pageName ||
      selectedPageKey
    );
  }, [pages, selectedPageKey]);

  async function loadMeta() {
    try {
      const data = await getPageContentMeta();
      setPages(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load pages");
    }
  }

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
        },
        sections: Array.isArray(data?.sections) ? data.sections : [],
      };

      setPageData(safeData);
      setSectionsJson(JSON.stringify(safeData.sections || [], null, 2));
    } catch (err) {
      setError(err.message || "Failed to load page content");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMeta();
  }, []);

  useEffect(() => {
    loadPage(selectedPageKey);
  }, [selectedPageKey]);

  function updateField(name, value) {
    setPageData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function updateHeroField(name, value) {
    setPageData((prev) => ({
      ...prev,
      hero: {
        ...prev.hero,
        [name]: value,
      },
    }));
  }

  async function handleSave() {
    try {
      setSaving(true);
      setError("");
      setNotice("");

      let parsedSections = [];

      try {
        parsedSections = JSON.parse(sectionsJson || "[]");
      } catch {
        setError("Sections JSON is not valid");
        return;
      }

      if (!Array.isArray(parsedSections)) {
        setError("Sections must be an array");
        return;
      }

      const payload = {
        ...pageData,
        pageKey: selectedPageKey,
        pageName: pageData.pageName || selectedPageName,
        sections: parsedSections,
      };

      const result = await updatePageContent(selectedPageKey, payload);

      setPageData({
        ...emptyPage,
        ...(result.page || payload),
        hero: {
          ...emptyPage.hero,
          ...((result.page || payload).hero || {}),
        },
      });

      setNotice("Page content saved successfully");
    } catch (err) {
      setError(err.message || "Failed to save page content");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F2F2F2] text-[#1A1A1A] p-8">
      <div className="max-w-[1400px] mx-auto">
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

        <section className="mb-6 rounded-3xl bg-white border border-[#E5E5E5] shadow-card p-6">
          <label className="block text-xs font-bold uppercase tracking-widest text-[#333333] mb-2">
            Select User Page
          </label>

          <select
            value={selectedPageKey}
            onChange={(e) => setSelectedPageKey(e.target.value)}
            className="w-full h-12 rounded-xl border border-[#DDDDDD] bg-[#F2F2F2] px-4 outline-none focus:border-[#D62828]"
          >
            {pages.map((page) => (
              <option key={page.pageKey} value={page.pageKey}>
                {page.pageName}
              </option>
            ))}
          </select>
        </section>

        {loading ? (
          <div className="rounded-3xl bg-white border border-[#E5E5E5] shadow-card p-10 text-center text-[#333333]/70">
            Loading page content...
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <section className="xl:col-span-2 rounded-3xl bg-white border border-[#E5E5E5] shadow-card p-6 space-y-6">
              <div>
                <h2 className="text-2xl font-extrabold heading-font mb-1">
                  {selectedPageName}
                </h2>

                <p className="text-sm text-[#333333]/70">
                  Basic page information and hero content.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field
                  label="Page Name"
                  value={pageData.pageName || ""}
                  onChange={(value) => updateField("pageName", value)}
                />

                <Field
                  label="Page Title"
                  value={pageData.title || ""}
                  onChange={(value) => updateField("title", value)}
                />

                <TextArea
                  label="Page Description"
                  value={pageData.description || ""}
                  onChange={(value) => updateField("description", value)}
                  className="md:col-span-2"
                />

                <Field
                  label="Hero Title"
                  value={pageData.hero?.title || ""}
                  onChange={(value) => updateHeroField("title", value)}
                />

                <Field
                  label="Hero Subtitle"
                  value={pageData.hero?.subtitle || ""}
                  onChange={(value) => updateHeroField("subtitle", value)}
                />

                <TextArea
                  label="Hero Description"
                  value={pageData.hero?.description || ""}
                  onChange={(value) => updateHeroField("description", value)}
                  className="md:col-span-2"
                />

                <Field
                  label="Hero Image URL"
                  value={pageData.hero?.imageUrl || ""}
                  onChange={(value) => updateHeroField("imageUrl", value)}
                />

                <Field
                  label="Hero Button Text"
                  value={pageData.hero?.buttonText || ""}
                  onChange={(value) => updateHeroField("buttonText", value)}
                />

                <Field
                  label="Hero Button Link"
                  value={pageData.hero?.buttonLink || ""}
                  onChange={(value) => updateHeroField("buttonLink", value)}
                />

                <label className="flex items-center justify-between rounded-2xl bg-[#F2F2F2] border border-[#DDDDDD] px-5 py-4">
                  <span className="text-sm font-bold heading-font">
                    Published
                  </span>

                  <input
                    type="checkbox"
                    checked={Boolean(pageData.isPublished)}
                    onChange={() =>
                      updateField("isPublished", !pageData.isPublished)
                    }
                    className="w-5 h-5 accent-[#D62828]"
                  />
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-[#333333] mb-2">
                  Sections JSON
                </label>

                <textarea
                  rows="18"
                  value={sectionsJson}
                  onChange={(e) => setSectionsJson(e.target.value)}
                  className="w-full rounded-2xl border border-[#DDDDDD] bg-[#111214] text-white px-4 py-4 outline-none font-mono text-sm resize-y"
                />
              </div>
            </section>

            <aside className="space-y-6">
              <section className="rounded-3xl bg-white border border-[#E5E5E5] shadow-card p-6">
                <h3 className="text-xl font-extrabold heading-font mb-4">
                  Preview
                </h3>

                <div className="rounded-2xl bg-[#F2F2F2] p-5">
                  {pageData.hero?.imageUrl && (
                    <img
                      src={pageData.hero.imageUrl}
                      alt=""
                      className="w-full h-40 object-cover rounded-xl mb-4"
                    />
                  )}

                  <p className="text-xs uppercase tracking-widest text-[#333333]/60 mb-2">
                    {pageData.pageName}
                  </p>

                  <h4 className="text-2xl font-extrabold heading-font mb-2">
                    {pageData.hero?.title || pageData.title || "Page Title"}
                  </h4>

                  <p className="text-sm text-[#333333]/70 whitespace-pre-line">
                    {pageData.hero?.description ||
                      pageData.description ||
                      "Page description preview"}
                  </p>

                  {pageData.hero?.buttonText && (
                    <div className="mt-4 inline-flex rounded-xl bg-[#D62828] text-white px-4 py-2 text-sm font-bold">
                      {pageData.hero.buttonText}
                    </div>
                  )}
                </div>
              </section>

              <section className="rounded-3xl bg-white border border-[#E5E5E5] shadow-card p-6">
                <h3 className="text-xl font-extrabold heading-font mb-4">
                  Section Example
                </h3>

                <pre className="text-xs bg-[#111214] text-white rounded-2xl p-4 overflow-auto">
{`[
  {
    "key": "about",
    "title": "About Sono School",
    "subtitle": "Learn with confidence",
    "body": "Write section text here...",
    "imageUrl": "/images/about.jpg",
    "buttonText": "Learn More",
    "buttonLink": "/about-us",
    "items": [
      {
        "title": "Expert Team",
        "description": "Professional instructors"
      }
    ]
  }
]`}
                </pre>
              </section>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}

function Field({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-widest text-[#333333] mb-2">
        {label}
      </label>

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-12 rounded-xl border border-[#DDDDDD] bg-[#F2F2F2] px-4 outline-none focus:border-[#D62828]"
      />
    </div>
  );
}

function TextArea({ label, value, onChange, className = "" }) {
  return (
    <div className={className}>
      <label className="block text-xs font-bold uppercase tracking-widest text-[#333333] mb-2">
        {label}
      </label>

      <textarea
        rows="4"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-[#DDDDDD] bg-[#F2F2F2] px-4 py-3 outline-none focus:border-[#D62828] resize-none"
      />
    </div>
  );
}