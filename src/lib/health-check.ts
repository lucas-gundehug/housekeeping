// Pings personal-dashboard's /api/public/health — it has its own real
// diagnostic endpoint (checks its own database/Redis, Spotify, calendar,
// etc.), unauthenticated on purpose, so this needs no shared secret unlike
// personal-dashboard-client.ts. Runs server-side because the browser can't
// reliably reach that origin directly (no CORS headers set up for that) —
// same reasoning as personal-dashboard-client.ts proxying through a
// Housekeeping-owned route instead of calling out straight from the browser.
export type ServiceHealth = { ok: boolean; ms: number | null };

const TIMEOUT_MS = 5000;

async function ping(
  baseUrl: string | undefined,
  path: string,
): Promise<ServiceHealth> {
  if (!baseUrl) return { ok: false, ms: null };
  const started = Date.now();
  try {
    const res = await fetch(`${baseUrl}${path}`, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return { ok: res.ok, ms: Date.now() - started };
  } catch {
    return { ok: false, ms: null };
  }
}

export async function checkPersonalDashboardHealth(): Promise<ServiceHealth> {
  return ping(process.env.PERSONAL_DASHBOARD_BASE_URL, "/api/public/health");
}
