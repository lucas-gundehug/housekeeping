import { describe, expect, it } from "vitest";
import { getIsoWeekKey } from "./iso-week";

describe("getIsoWeekKey", () => {
  it("matches personal-dashboard's known week keys", () => {
    expect(getIsoWeekKey(new Date(Date.UTC(2026, 7, 25)))).toBe("2026-W35"); // Aug 25 2026, Tue
    expect(getIsoWeekKey(new Date(Date.UTC(2026, 0, 1)))).toBe("2026-W01"); // Jan 1 2026, Thu
    expect(getIsoWeekKey(new Date(Date.UTC(2025, 11, 29)))).toBe("2026-W01"); // Dec 29 2025, Mon — belongs to 2026's week 1
  });
});
