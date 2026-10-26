// Thin client-side wrapper around /api/dashboard/change-code — the personal
// dashboard's 4-digit access code, changeable from the Admin tab.

import { authedFetch } from "@/lib/authed-fetch";

export type CodeChangeResult = { ok: boolean; error?: string };

export async function changeDashboardCode(
  newCode: string,
  authHeaders: HeadersInit,
): Promise<CodeChangeResult> {
  try {
    const res = await authedFetch("/api/dashboard/change-code", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({ newCode }),
    });
    return await res.json();
  } catch {
    return { ok: false, error: "network" };
  }
}
