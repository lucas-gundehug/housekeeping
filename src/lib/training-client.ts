// Thin client-side wrappers around /api/training/* — mirrors events-client.ts's
// pattern, talking to this app's own routes (which in turn go straight to
// personal-dashboard's Supabase project, see personal-dashboard-training.ts).

import { authedFetch } from "@/lib/authed-fetch";

export type ProgressionExercise = {
  id: string;
  label: string;
  step: number;
  lastWeekApplied: string | null;
  wasDeloadHold: boolean;
};

export type ProgressionSession = {
  id: string;
  label: string;
  exercises: ProgressionExercise[];
};

async function fetchProgressionOverviewOnce(
  authHeaders: HeadersInit,
): Promise<ProgressionSession[] | null> {
  try {
    const res = await authedFetch("/api/training/overview", {
      headers: authHeaders,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { sessions?: ProgressionSession[] };
    return data.sessions ?? [];
  } catch {
    return null;
  }
}

// One built-in retry: absorbs a known transient cold-start hiccup (the
// first serverless invocation after idle occasionally 500s on a
// clock-skew-flavored Supabase error, then succeeds immediately on retry)
// instead of surfacing it to the UI as a permanently stuck load.
export async function fetchProgressionOverview(
  authHeaders: HeadersInit,
): Promise<ProgressionSession[] | null> {
  const first = await fetchProgressionOverviewOnce(authHeaders);
  if (first !== null) return first;
  await new Promise((resolve) => setTimeout(resolve, 800));
  return fetchProgressionOverviewOnce(authHeaders);
}

export async function resetCurrentWeek(
  authHeaders: HeadersInit,
): Promise<{ ok: boolean; week?: string }> {
  try {
    const res = await authedFetch("/api/training/reset-week", {
      method: "POST",
      headers: authHeaders,
    });
    if (!res.ok) return { ok: false };
    return await res.json();
  } catch {
    return { ok: false };
  }
}

export async function setExerciseStep(
  exerciseId: string,
  step: number,
  authHeaders: HeadersInit,
): Promise<boolean> {
  const res = await authedFetch("/api/training/set-step", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders },
    body: JSON.stringify({ exerciseId, step }),
  }).catch(() => null);
  return !!res?.ok;
}
