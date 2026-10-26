// Same ISO 8601 week-key formula as personal-dashboard's workout-plan.ts
// (e.g. "2026-W34") — duplicated rather than shared across repos, same as
// log.ts; this is the storage key workout_sessions/exercise_ratings use.
export function getIsoWeekKey(date: Date): string {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function isoWeekMonday(year: number, week: number) {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const week1Monday = new Date(jan4);
  week1Monday.setUTCDate(jan4.getUTCDate() - (jan4.getUTCDay() || 7) + 1);
  const monday = new Date(week1Monday);
  monday.setUTCDate(week1Monday.getUTCDate() + (week - 1) * 7);
  return monday;
}

// Same duplication as getIsoWeekKey above — matches personal-dashboard's
// workout-plan.ts exactly, needed here to derive the same "was this
// last_week_applied transition a deload hold" answer workout-store.ts
// computes for itself.
export function getPreviousIsoWeekKey(week: string): string {
  const [yearStr, weekStr] = week.split("-W");
  const monday = isoWeekMonday(Number(yearStr), Number(weekStr));
  monday.setUTCDate(monday.getUTCDate() - 7);
  return getIsoWeekKey(monday);
}
