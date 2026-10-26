import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { AuthGate } from "@/components/login-gate";
import { Button } from "@/components/ui/button";
import { fetchAuditLog, type AuditLogEntry } from "@/lib/audit-log-client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/changelog")({
  head: () => ({ meta: [{ name: "robots", content: "noindex, nofollow" }] }),
  component: Gate,
});

function ChangelogPage({ authHeaders }: { authHeaders: HeadersInit }) {
  const [entries, setEntries] = useState<AuditLogEntry[] | null | "error">(
    null,
  );

  function load() {
    setEntries(null);
    fetchAuditLog(authHeaders).then((result) => setEntries(result ?? "error"));
  }

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AppShell
      active="changelog"
      title="Changelog"
      description="What changed on this page and when — no per-person identity, since login is one shared passphrase, not individual accounts."
    >
      {entries === "error" ? (
        <div className="flex items-center justify-between gap-3 rounded-xl hairline border surface-tint p-4">
          <p className="text-xs text-destructive">Couldn't load — try again</p>
          <Button size="sm" variant="outline" onClick={load}>
            Retry
          </Button>
        </div>
      ) : entries === null ? (
        <p className="text-xs text-muted-foreground">Loading…</p>
      ) : entries.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nothing logged yet.</p>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-3 rounded-xl hairline border surface-tint px-4 py-3 text-sm"
            >
              <span className="min-w-0 truncate">
                {entry.action}
                {entry.detail && (
                  <span className="text-muted-foreground">
                    {" "}
                    — {entry.detail}
                  </span>
                )}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {new Date(entry.at).toLocaleString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}

function Gate() {
  const { authToken } = useAuth();
  return (
    <AuthGate>
      <ChangelogPage authHeaders={{ Authorization: `Bearer ${authToken}` }} />
    </AuthGate>
  );
}
