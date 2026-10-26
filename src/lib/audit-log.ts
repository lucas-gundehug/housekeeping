import { redis } from "@/lib/redis";

// Change log for the Admin page — "what changed, when", deliberately no
// "who": there are no individual staff accounts, only the one shared
// passphrase (see auth.ts), so there's no identity to attach beyond that.
// Same Redis-or-in-memory fallback pattern as the rest of this app (e.g.
// login-rate-limit.ts) — a capped list rather than a full history table,
// since this is a lightweight "did something weird happen tonight" check,
// not a durable audit trail.
export type AuditLogEntry = {
  action: string;
  detail?: string;
  at: string;
};

const KEY = "audit:admin";
const MAX_ENTRIES = 200;

const memoryLog: AuditLogEntry[] = [];

export async function logAdminAction(
  action: string,
  detail?: string,
): Promise<void> {
  const entry: AuditLogEntry = { action, detail, at: new Date().toISOString() };

  if (redis) {
    await redis.lpush(KEY, JSON.stringify(entry));
    await redis.ltrim(KEY, 0, MAX_ENTRIES - 1);
    return;
  }

  memoryLog.unshift(entry);
  memoryLog.length = Math.min(memoryLog.length, MAX_ENTRIES);
}

export async function getAuditLog(): Promise<AuditLogEntry[]> {
  if (redis) {
    const raw = await redis.lrange<string>(KEY, 0, MAX_ENTRIES - 1);
    return raw.flatMap((r) => {
      try {
        // Upstash's client already JSON-parses list members for us in some
        // configurations — guard for both a string and an already-parsed
        // object coming back.
        return [
          typeof r === "string"
            ? (JSON.parse(r) as AuditLogEntry)
            : (r as AuditLogEntry),
        ];
      } catch {
        return [];
      }
    });
  }
  return memoryLog;
}
