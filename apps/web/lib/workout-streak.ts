/**
 * Streaks use UTC calendar days from stored workout instants (calendar dates are
 * stored as UTC noon per workout day — see calendar-date.ts).
 *
 * Current streak: count consecutive workout days ending at today if you logged today,
 * otherwise ending at yesterday (so missing "today" alone does not break the streak).
 */

function utcCalendarDayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addUtcCalendarDays(dayKey: string, deltaDays: number): string {
  const d = new Date(`${dayKey}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + deltaDays);
  return d.toISOString().slice(0, 10);
}

export function computeWorkoutStreaks(dates: Date[]): { current: number; longest: number } {
  if (dates.length === 0) return { current: 0, longest: 0 };

  const daySet = new Set(dates.map(utcCalendarDayKey));
  const sortedAsc = [...daySet].sort((a, b) => a.localeCompare(b));

  let longest = 1;
  let run = 1;
  for (let i = 1; i < sortedAsc.length; i++) {
    const prev = sortedAsc[i - 1]!;
    const cur = sortedAsc[i]!;
    if (addUtcCalendarDays(prev, 1) === cur) {
      run++;
      longest = Math.max(longest, run);
    } else {
      run = 1;
    }
  }

  const today = utcCalendarDayKey(new Date());
  const yesterday = addUtcCalendarDays(today, -1);

  let endKey: string | null = null;
  if (daySet.has(today)) endKey = today;
  else if (daySet.has(yesterday)) endKey = yesterday;
  else return { current: 0, longest };

  let current = 0;
  let cursor = endKey;
  while (daySet.has(cursor)) {
    current++;
    cursor = addUtcCalendarDays(cursor, -1);
  }

  return { current, longest: Math.max(longest, current) };
}
