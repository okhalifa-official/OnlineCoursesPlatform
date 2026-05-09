import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export default function useSiteContent(pageKey) {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadContent() {
      try {
        const res = await fetch(`${API_URL}/public/page-content/${pageKey}`);
        const data = await res.json();

        if (res.ok && data) {
          setContent(data);
        } else {
          setContent(null);
        }
      } catch (error) {
        console.error("Site content error:", error.message);
        setContent(null);
      } finally {
        setLoading(false);
      }
    }

    loadContent();
  }, [pageKey]);

  function getSection(sectionKey) {
    return (
      content?.sections?.find((section) => section.key === sectionKey) || null
    );
  }

  return {
    content,
    loading,
    hero: content?.hero || null,
    sections: content?.sections || [],
    getSection,
  };
}