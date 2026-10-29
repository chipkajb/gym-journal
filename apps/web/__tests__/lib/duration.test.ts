import { formatClock, parseDurationInput } from "@/lib/duration";

describe("formatClock", () => {
  it.each([
    [0, "0:00"],
    [5, "0:05"],
    [65, "1:05"],
    [3599, "59:59"],
    [3600, "1:00:00"],
    [3725, "1:02:05"],
    [61.9, "1:01"],
    [-3, "0:00"],
  ])("%p -> %p", (secs, expected) => {
    expect(formatClock(secs)).toBe(expected);
  });
});

describe("parseDurationInput", () => {
  it.each([
    ["", null],
    ["   ", null],
    ["12:30", 750],
    ["1:02:03", 3723],
    ["45", 2700],
    ["1.5", 90],
    ["1:ab", null],
    ["abc", null],
    ["1:2:3:4", null],
    ["-5", null],
  ])("%p -> %p", (input, expected) => {
    expect(parseDurationInput(input)).toBe(expected);
  });

  it("round-trips with formatClock", () => {
    for (const secs of [0, 59, 600, 3725]) {
      expect(parseDurationInput(formatClock(secs))).toBe(secs);
    }
  });
});
