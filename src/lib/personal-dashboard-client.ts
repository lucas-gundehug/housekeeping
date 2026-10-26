// Server-to-server client for personal-dashboard's admin-only change-code
// route — authenticates with a static shared secret
// (PERSONAL_DASHBOARD_SERVICE_SECRET, sent as the X-Housekeeping-Secret
// header personal-dashboard checks in admin-auth-service.ts) instead of
// recreating its password-based session-signing here.

function requireConfig() {
  const baseUrl = process.env.PERSONAL_DASHBOARD_BASE_URL;
  const secret = process.env.PERSONAL_DASHBOARD_SERVICE_SECRET;
  if (!baseUrl || !secret) {
    throw new Error(
      "PERSONAL_DASHBOARD_BASE_URL / PERSONAL_DASHBOARD_SERVICE_SECRET not configured",
    );
  }
  return { baseUrl, secret };
}

export type CodeChangeResult =
  { ok: true } | { ok: false; error: "invalid_code" | "unknown" };

export async function changeDashboardCode(
  newCode: string,
): Promise<CodeChangeResult> {
  const { baseUrl, secret } = requireConfig();
  const res = await fetch(`${baseUrl}/api/admin/change-code`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Housekeeping-Secret": secret,
    },
    body: JSON.stringify({ newCode }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    error?: string;
  };
  if (data.ok) return { ok: true };
  return {
    ok: false,
    error: data.error === "invalid_code" ? "invalid_code" : "unknown",
  };
}
