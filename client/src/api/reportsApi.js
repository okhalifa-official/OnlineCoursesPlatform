import { apiFetch } from "./apiClient";

export async function getReportsOverview() {
  return apiFetch("/reports/overview");
}