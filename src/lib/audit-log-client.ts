import { authedFetch } from "@/lib/authed-fetch";

export type AuditLogEntry = {
  action: string;
  detail?: string;
  at: string;
};

export async function fetchAuditLog(
  authHeaders: HeadersInit,
): Promise<AuditLogEntry[] | null> {
  try {
    const res = await authedFetch("/api/admin/audit-log", {
      headers: authHeaders,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { entries?: AuditLogEntry[] };
    return data.entries ?? [];
  } catch {
    return null;
  }
}
