import { adminFetch } from "./apiClient";

export async function getReportsOverview() {
  return adminFetch("/reports/overview");
}