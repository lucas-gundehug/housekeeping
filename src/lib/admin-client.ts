// Thin client-side wrapper around /api/admin/change-passphrase —
// Housekeeping's own login passphrase, changeable from the Admin tab.

import { authedFetch } from "@/lib/authed-fetch";

export type PassphraseChangeResult =
  { ok: true; token: string } | { ok: false; error?: string };

export async function changePassphrase(
  currentPassphrase: string,
  newPassphrase: string,
  authHeaders: HeadersInit,
): Promise<PassphraseChangeResult> {
  try {
    const res = await authedFetch("/api/admin/change-passphrase", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({ currentPassphrase, newPassphrase }),
    });
    return await res.json();
  } catch {
    return { ok: false, error: "network" };
  }
}
