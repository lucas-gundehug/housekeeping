import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { AuthGate } from "@/components/login-gate";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import {
  fetchProgressionOverview,
  resetCurrentWeek,
  setExerciseStep,
  type ProgressionSession,
} from "@/lib/training-client";

export const Route = createFileRoute("/training")({
  head: () => ({ meta: [{ name: "robots", content: "noindex, nofollow" }] }),
  component: Gate,
});

const stepInputClass =
  "w-16 rounded-md hairline border surface-tint px-2 py-1.5 text-sm text-center outline-none focus:border-primary/60";

function StepEditor({
  exerciseId,
  initialStep,
  authHeaders,
}: {
  exerciseId: string;
  initialStep: number;
  authHeaders: HeadersInit;
}) {
  const [value, setValue] = useState(String(initialStep));
  const [saving, setSaving] = useState(false);

  async function save() {
    const parsed = Number(value);
    if (Number.isNaN(parsed)) {
      toast("Invalid number");
      setValue(String(initialStep));
      return;
    }
    setSaving(true);
    const ok = await setExerciseStep(exerciseId, parsed, authHeaders);
    setSaving(false);
    toast(ok ? "Step updated" : "Couldn't save — try again");
    if (!ok) setValue(String(initialStep));
  }

  return (
    <div className="flex items-center gap-3">
      <input
        type="number"
        min={0}
        max={10}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className={stepInputClass}
      />
      <Button size="sm" variant="outline" disabled={saving} onClick={save}>
        {saving ? "Saving…" : "Save"}
      </Button>
    </div>
  );
}

function TrainingPage({ authHeaders }: { authHeaders: HeadersInit }) {
  const [sessions, setSessions] = useState<ProgressionSession[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [resetting, setResetting] = useState(false);

  function loadProgression() {
    setLoadError(false);
    setSessions(null);
    fetchProgressionOverview(authHeaders).then((result) => {
      if (result === null) setLoadError(true);
      else setSessions(result);
    });
  }

  useEffect(() => {
    loadProgression();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleReset() {
    if (
      !confirm(
        "Reset this week's training? Checked-off sessions and difficulty ratings for this week will be deleted. Progression steps (the numbers) are NOT touched.",
      )
    ) {
      return;
    }
    setResetting(true);
    const result = await resetCurrentWeek(authHeaders);
    setResetting(false);
    toast(
      result.ok ? `Week ${result.week} reset` : "Couldn't reset — try again",
    );
  }

  return (
    <AppShell
      active="training"
      title="Training"
      description="Personal-dashboard's Supabase project. The plan itself (exercises/sessions) is still edited on the dashboard's /workout-edit page — this is just weekly data and progression."
    >
      <div className="space-y-3">
        <div className="rounded-xl border border-destructive/40 surface-tint p-4">
          <h2 className="font-medium">Reset this week</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Deletes this week's checkmarks and difficulty ratings. Progression
            steps (the numbers in the training plan) are not affected.
          </p>
          <Button
            variant="destructive"
            size="sm"
            className="mt-3"
            disabled={resetting}
            onClick={handleReset}
          >
            {resetting ? "Resetting…" : "Reset this week"}
          </Button>
        </div>

        <div className="rounded-xl hairline border surface-tint p-4">
          <h2 className="font-medium">Progression per exercise</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            The step number controls how many reps/seconds the exercise shows in
            the training plan. Only edit it if the automatic adjustment got it
            wrong.
          </p>
          {loadError ? (
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-xs text-destructive">
                Couldn't load — try again
              </p>
              <Button size="sm" variant="outline" onClick={loadProgression}>
                Try again
              </Button>
            </div>
          ) : sessions === null ? (
            <p className="mt-3 text-xs text-muted-foreground">Loading…</p>
          ) : (
            <div className="mt-3 space-y-4">
              {sessions.map((session) => (
                <div key={session.id}>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    {session.label}
                  </h3>
                  <div className="mt-2 space-y-2">
                    {session.exercises.map((ex) => (
                      <div
                        key={ex.id}
                        className="flex items-center justify-between gap-3 rounded-md hairline border surface-tint px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm">{ex.label}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {ex.lastWeekApplied
                              ? `Last adjusted: week ${ex.lastWeekApplied}`
                              : "Not yet adjusted"}
                            {ex.wasDeloadHold && (
                              <span className="text-amber-500">
                                {" "}
                                · deload week — held instead of stepping down
                                further
                              </span>
                            )}
                          </p>
                        </div>
                        <StepEditor
                          exerciseId={ex.id}
                          initialStep={ex.step}
                          authHeaders={authHeaders}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function Gate() {
  const { authToken } = useAuth();
  return (
    <AuthGate>
      <TrainingPage authHeaders={{ Authorization: `Bearer ${authToken}` }} />
    </AuthGate>
  );
}
