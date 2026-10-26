import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { AuthGate } from "@/components/login-gate";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import {
  fetchHealth,
  type HealthReport,
  type ServiceHealth,
} from "@/lib/health-client";

export const Route = createFileRoute("/health")({
  head: () => ({ meta: [{ name: "robots", content: "noindex, nofollow" }] }),
  component: Gate,
});

// A diagnostic tool, not a live screen someone stares at during a party —
// 30s is plenty.
const POLL_MS = 30000;

function StatusRow({
  label,
  description,
  health,
}: {
  label: string;
  description: string;
  health: ServiceHealth | undefined;
}) {
  const state = health === undefined ? "checking" : health.ok ? "up" : "down";
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl hairline border surface-tint p-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`h-2.5 w-2.5 shrink-0 rounded-full ${
              state === "checking"
                ? "bg-muted-foreground/50"
                : state === "up"
                  ? "bg-emerald-500"
                  : "bg-destructive"
            }`}
          />
          <h2 className="font-medium">{label}</h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="shrink-0 text-right text-xs text-muted-foreground">
        {state === "checking"
          ? "Checking…"
          : state === "up"
            ? `Up${health?.ms != null ? ` · ${health.ms}ms` : ""}`
            : "Unreachable"}
      </div>
    </div>
  );
}

function HealthPage({ authHeaders }: { authHeaders: HeadersInit }) {
  const [report, setReport] = useState<HealthReport | null | "error">(null);

  const load = useCallback(() => {
    fetchHealth(authHeaders).then((result) => setReport(result ?? "error"));
  }, [authHeaders]);

  useEffect(() => {
    load();
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [load]);

  return (
    <AppShell
      active="health"
      title="Health"
      description="Is the personal dashboard reachable from Housekeeping right now."
    >
      {report === "error" && (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-xl hairline border surface-tint p-4">
          <p className="text-xs text-destructive">Couldn't load — try again</p>
          <Button size="sm" variant="outline" onClick={load}>
            Retry
          </Button>
        </div>
      )}
      <div className="space-y-3">
        <StatusRow
          label="Personal dashboard"
          description="The personal dashboard, including the Training data Housekeeping reads/writes directly."
          health={
            report === "error" || report === null
              ? undefined
              : report.personalDashboard
          }
        />
      </div>
    </AppShell>
  );
}

function Gate() {
  const { authToken } = useAuth();
  return (
    <AuthGate>
      <HealthPage authHeaders={{ Authorization: `Bearer ${authToken}` }} />
    </AuthGate>
  );
}
