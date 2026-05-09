import { adminFetch } from "./apiClient";

export async function getPageContentMeta() {
  return adminFetch("/page-content/meta");
}

export async function getAllPageContents() {
  return adminFetch("/page-content");
}

export async function getPageContentByKey(pageKey) {
  return adminFetch(`/page-content/${pageKey}`);
}

export async function updatePageContent(pageKey, data) {
  return adminFetch(`/page-content/${pageKey}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}