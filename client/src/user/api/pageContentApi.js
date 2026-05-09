const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export async function getPublicPageContent(pageKey) {
  const res = await fetch(`${API_URL}/public/page-content/${pageKey}`);

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.message || "Failed to load page content");
  }

  return data;
}