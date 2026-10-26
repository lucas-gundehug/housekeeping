import { personalDashboardSupabase as supabase } from "@/lib/personal-dashboard-supabase";
import { getIsoWeekKey, getPreviousIsoWeekKey } from "@/lib/iso-week";

const PROGRESSION_MAX_STEP = 10;
// Same window as workout-store.ts's shouldHoldForDeload — three "hard"
// weeks in a row escalates a normal -1 step into a held (skipped)
// adjustment for that week instead.
const HISTORY_WEEKS = 3;

type Difficulty = "easy" | "ok" | "hard";

export type ProgressionExercise = {
  id: string;
  label: string;
  step: number;
  lastWeekApplied: string | null;
  // True when lastWeekApplied's transition was a deload hold (three "hard"
  // weeks in a row) rather than the routine ±1 adjustment — informational
  // only, there's nothing to click here. See workout-store.ts's
  // shouldHoldForDeload for the source of truth this mirrors.
  wasDeloadHold: boolean;
};

export type ProgressionSession = {
  id: string;
  label: string;
  exercises: ProgressionExercise[];
};

function requireSupabase() {
  if (!supabase) {
    throw new Error(
      "PERSONAL_DASHBOARD_SUPABASE_URL / PERSONAL_DASHBOARD_SUPABASE_SERVICE_ROLE_KEY not configured",
    );
  }
  return supabase;
}

// Read-only view of every strength exercise's current progression step and
// when it was last auto-adjusted — the diagnostic half of Housekeeping's
// Training section. Run sessions are excluded entirely: they never have a
// progression step (see personal-dashboard's workout-store.ts).
export async function getProgressionOverview(): Promise<ProgressionSession[]> {
  const db = requireSupabase();
  const [sessionsRes, exercisesRes, progressionRes] = await Promise.all([
    db
      .from("workout_plan_sessions")
      .select("id, label, position")
      .eq("kind", "strength")
      .order("position"),
    db
      .from("workout_plan_exercises")
      .select("id, session_id, label, position")
      .order("position"),
    db
      .from("exercise_progression")
      .select("exercise_id, step, last_week_applied"),
  ]);
  if (sessionsRes.error) throw sessionsRes.error;
  if (exercisesRes.error) throw exercisesRes.error;
  if (progressionRes.error) throw progressionRes.error;

  const progressionByExercise = new Map(
    (progressionRes.data ?? []).map((r) => [r.exercise_id, r]),
  );

  // Only fetched for exercises that actually have a last_week_applied to
  // evaluate — a brand-new exercise with no progression row yet has nothing
  // to check.
  const appliedWeeks = [...progressionByExercise.values()]
    .map((p) => p.last_week_applied)
    .filter((w): w is string => !!w);
  const lookbackWeeks = new Set<string>();
  for (const w of appliedWeeks) {
    let cursor = w;
    lookbackWeeks.add(cursor);
    for (let i = 0; i < HISTORY_WEEKS; i++) {
      cursor = getPreviousIsoWeekKey(cursor);
      lookbackWeeks.add(cursor);
    }
  }
  const ratingsRes = lookbackWeeks.size
    ? await db
        .from("exercise_ratings")
        .select("exercise_id, week, difficulty")
        .in("week", [...lookbackWeeks])
    : { data: [], error: null };
  if (ratingsRes.error) throw ratingsRes.error;

  const ratingsByExercise = new Map<
    string,
    { week: string; difficulty: Difficulty }[]
  >();
  for (const row of ratingsRes.data ?? []) {
    const list = ratingsByExercise.get(row.exercise_id) ?? [];
    list.push({ week: row.week, difficulty: row.difficulty as Difficulty });
    ratingsByExercise.set(row.exercise_id, list);
  }

  // Mirrors workout-store.ts's shouldHoldForDeload exactly: the 3 weeks
  // ending at `appliedWeek` (the last transition that ran) were all "hard",
  // and the week before that 3-week window wasn't — i.e. this was a fresh
  // streak, not a continuation already handled by an earlier transition.
  function wasDeloadHold(exerciseId: string, appliedWeek: string): boolean {
    const ratings = ratingsByExercise.get(exerciseId) ?? [];
    const difficultyOf = (week: string) =>
      ratings.find((r) => r.week === week)?.difficulty;
    let cursor = appliedWeek;
    const last3: (Difficulty | undefined)[] = [];
    for (let i = 0; i < HISTORY_WEEKS; i++) {
      last3.push(difficultyOf(cursor));
      cursor = getPreviousIsoWeekKey(cursor);
    }
    const fourthWeekBack = difficultyOf(cursor);
    return last3.every((d) => d === "hard") && fourthWeekBack !== "hard";
  }

  return (sessionsRes.data ?? []).map((s) => ({
    id: s.id,
    label: s.label,
    exercises: (exercisesRes.data ?? [])
      .filter((e) => e.session_id === s.id)
      .map((e) => {
        const prog = progressionByExercise.get(e.id);
        const lastWeekApplied = prog?.last_week_applied ?? null;
        return {
          id: e.id,
          label: e.label,
          step: prog?.step ?? 0,
          lastWeekApplied,
          wasDeloadHold: lastWeekApplied
            ? wasDeloadHold(e.id, lastWeekApplied)
            : false,
        };
      }),
  }));
}

// Clears this week's session-completion checkmarks and exercise ratings —
// deliberately leaves exercise_progression untouched, since progression is
// long-term state, not something "this week" owns. Lets the owner redo a
// week from scratch without losing the step numbers they've built up.
export async function resetCurrentWeek(): Promise<{ week: string }> {
  const db = requireSupabase();
  const week = getIsoWeekKey(new Date());
  const [sessionsRes, ratingsRes] = await Promise.all([
    db.from("workout_sessions").delete().eq("week", week),
    db.from("exercise_ratings").delete().eq("week", week),
  ]);
  if (sessionsRes.error) throw sessionsRes.error;
  if (ratingsRes.error) throw ratingsRes.error;
  return { week };
}

// Manual override for a single exercise's progression step — e.g. the
// auto-adjustment got something wrong and the owner doesn't want to wait a week
// for it to correct itself. Only touches `step`; `last_week_applied` is
// left as-is, so the normal weekly auto-adjustment keeps working from
// whatever new baseline this sets.
export async function setExerciseStep(
  exerciseId: string,
  step: number,
): Promise<void> {
  const db = requireSupabase();
  const clamped = Math.max(0, Math.min(PROGRESSION_MAX_STEP, Math.round(step)));
  const { error } = await db.from("exercise_progression").upsert({
    exercise_id: exerciseId,
    step: clamped,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}
