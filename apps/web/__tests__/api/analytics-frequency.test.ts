/**
 * Unit tests for the frequency analytics bucketing logic.
 */
import { format, startOfWeek, startOfMonth } from "date-fns";

// Replicate the bucketing logic from the frequency API route for unit testing
function bucketSessions(
  sessions: { workoutDate: Date; rxOrScaled: string | null }[],
  groupBy: "week" | "month"
): Map<string, { total: number; rx: number; scaled: number }> {
  const buckets = new Map<string, { total: number; rx: number; scaled: number }>();

  for (const s of sessions) {
    const d = new Date(s.workoutDate);
    const key =
      groupBy === "week"
        ? format(startOfWeek(d, { weekStartsOn: 1 }), "yyyy-MM-dd")
        : format(startOfMonth(d), "yyyy-MM");
    if (!buckets.has(key)) {
      buckets.set(key, { total: 0, rx: 0, scaled: 0 });
    }
    const b = buckets.get(key)!;
    b.total++;
    if (s.rxOrScaled === "RX") b.rx++;
    else if (s.rxOrScaled === "Scaled") b.scaled++;
  }

  return buckets;
}

describe("frequency analytics bucketing", () => {
  const makeSessions = (dates: string[], rxOrScaled: string | null = null) =>
    dates.map((d) => ({ workoutDate: new Date(d), rxOrScaled }));

  it("returns empty map for no sessions", () => {
    expect(bucketSessions([], "week").size).toBe(0);
  });

  it("groups sessions into the correct week bucket", () => {
    const sessions = makeSessions(["2024-01-08", "2024-01-09", "2024-01-15"]);
    const buckets = bucketSessions(sessions, "week");
    expect(buckets.size).toBe(2);
  });

  it("groups sessions into the correct month bucket", () => {
    const sessions = makeSessions(["2024-01-08", "2024-01-25", "2024-02-05"]);
    const buckets = bucketSessions(sessions, "month");
    expect(buckets.size).toBe(2);
    expect(buckets.get("2024-01")?.total).toBe(2);
    expect(buckets.get("2024-02")?.total).toBe(1);
  });

  it("counts RX and Scaled separately", () => {
    const sessions = [
      { workoutDate: new Date("2024-01-08"), rxOrScaled: "RX" },
      { workoutDate: new Date("2024-01-09"), rxOrScaled: "Scaled" },
      { workoutDate: new Date("2024-01-10"), rxOrScaled: "RX" },
    ];
    const buckets = bucketSessions(sessions, "week");
    const week = buckets.values().next().value;
    expect(week.rx).toBe(2);
    expect(week.scaled).toBe(1);
    expect(week.total).toBe(3);
  });

  it("null rxOrScaled contributes to total but not rx/scaled counts", () => {
    const sessions = [
      { workoutDate: new Date("2024-01-08"), rxOrScaled: null },
    ];
    const buckets = bucketSessions(sessions, "week");
    const week = buckets.values().next().value;
    expect(week.total).toBe(1);
    expect(week.rx).toBe(0);
    expect(week.scaled).toBe(0);
  });
});
