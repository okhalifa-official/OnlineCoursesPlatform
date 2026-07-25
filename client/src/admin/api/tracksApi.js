// client/src/admin/api/tracksApi.js
import { adminFetch } from "./apiClient";

export async function getTracks() {
  return adminFetch("/tracks");
}

export async function createTrack(trackData) {
  return adminFetch("/tracks", {
    method: "POST",
    body: JSON.stringify(trackData),
  });
}

export async function updateTrack(id, trackData) {
  return adminFetch(`/tracks/${id}`, {
    method: "PUT",
    body: JSON.stringify(trackData),
  });
}

export async function deleteTrack(id) {
  return adminFetch(`/tracks/${id}`, {
    method: "DELETE",
  });
}
