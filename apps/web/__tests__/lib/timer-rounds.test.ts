import {
  adjustRoundsAfterTimeTrim,
  buildFinalTimerResult,
  parseDisplayTime,
  recomputeRoundDiffs,
  type Round,
} from "@/lib/timer/rounds";

const rounds = (splits: number[]): Round[] => {
  let elapsed = 0;
  return recomputeRoundDiffs(
    splits.map((split, i) => {
      elapsed += split;
      return { round: i + 1, elapsed, split, diffVsPrevSec: null };
    })
  );
};

describe("parseDisplayTime", () => {
  it("parses m:ss and h:mm:ss", () => {
    expect(parseDisplayTime("4:05")).toBe(245);
    expect(parseDisplayTime("1:00:01")).toBe(3601);
  });
  it("treats junk as zero", () => {
    expect(parseDisplayTime("x:10")).toBe(0);
    expect(parseDisplayTime("")).toBe(0);
  });
});

describe("recomputeRoundDiffs", () => {
  it("marks faster rounds positive", () => {
    expect(rounds([60, 50, 70]).map((r) => r.diffVsPrevSec)).toEqual([null, 10, -20]);
  });
});

describe("adjustRoundsAfterTimeTrim", () => {
  it("trims the tail after the last split first", () => {
    // splits end at 180s, clock stopped at 200s, user edits to 190s
    const out = adjustRoundsAfterTimeTrim(200, 190, rounds([60, 60, 60]));
    expect(out.map((r) => r.split)).toEqual([60, 60, 60]);
  });

  it("then trims the last round, dropping it when it reaches zero", () => {
    const out = adjustRoundsAfterTimeTrim(180, 100, rounds([60, 60, 60]));
    expect(out.map((r) => r.split)).toEqual([60, 40]);
    expect(out[out.length - 1]!.elapsed).toBe(100);
  });

  it("leaves rounds alone when time grows", () => {
    expect(adjustRoundsAfterTimeTrim(100, 120, rounds([50, 50])).map((r) => r.split)).toEqual([50, 50]);
  });
});

describe("buildFinalTimerResult", () => {
  const base = { mode: "fortime" as const, durationSeconds: 180, label: "3:00" };

  it("applies an edited finish time and rebuilds the notes", () => {
    const out = buildFinalTimerResult(base, "2:30", "fortime", rounds([60, 60, 60]));
    expect(out.durationSeconds).toBe(150);
    expect(out.label).toBe("2:30");
    expect(out.roundsNote).toContain("Round 3: 0:30");
  });

  it("notes extra time added after stop", () => {
    const out = buildFinalTimerResult(base, "3:10", "fortime", []);
    expect(out.durationSeconds).toBe(190);
    expect(out.roundsNote).toContain("+10s");
  });
});
