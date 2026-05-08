import { adminFetch } from "./apiClient";

export async function getAnnouncementMeta() {
  return adminFetch("/announcements/meta");
}

export async function getAnnouncements() {
  return adminFetch("/announcements");
}

export async function createAnnouncement(data) {
  return adminFetch("/announcements", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteAnnouncement(id) {
  return adminFetch(`/announcements/${id}`, {
    method: "DELETE",
  });
}