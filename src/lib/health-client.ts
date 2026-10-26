import { authedFetch } from "@/lib/authed-fetch";

export type ServiceHealth = { ok: boolean; ms: number | null };
export type HealthReport = {
  personalDashboard: ServiceHealth;
};

export async function fetchHealth(
  authHeaders: HeadersInit,
): Promise<HealthReport | null> {
  try {
    const res = await authedFetch("/api/admin/health", {
      headers: authHeaders,
    });
    if (!res.ok) return null;
    return (await res.json()) as HealthReport;
  } catch {
    return null;
  }
}
