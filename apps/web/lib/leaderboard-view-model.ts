import { computeWorkoutStreaks } from "@/lib/workout-streak";

/** Non-load sessions where RX or Scaled was explicitly chosen (unset rows excluded). */
function isRxOrScaledChoice(s: { scoreType: string; rxOrScaled: string | null }): boolean {
  if (s.scoreType === "Load") return false;
  const v = s.rxOrScaled;
  return v === "RX" || v === "SCALED" || v === "Scaled";
}

export type LeaderboardSessionInput = {
  id: string;
  title: string;
  workoutDate: Date;
  rxOrScaled: string | null;
  isPr: boolean;
  scoreType: string;
  bestResultDisplay: string | null;
  calories: number | null;
  maxHeartRate: number | null;
  avgHeartRate: number | null;
  totalDurationSeconds: number | null;
};

export function buildLeaderboardClientProps(allSessions: LeaderboardSessionInput[]) {
  const now = new Date();
  const rolling30Cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const rolling30Count = allSessions.filter(s => s.workoutDate >= rolling30Cutoff).length;

  const prSessions = allSessions.filter(s => s.isPr);
  const streaks = computeWorkoutStreaks(allSessions.map(s => s.workoutDate));

  const monthlyMap: Record<string, { total: number; rx: number }> = {};
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyMap[key] = { total: 0, rx: 0 };
  }
  allSessions.forEach(s => {
    const d = new Date(s.workoutDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (monthlyMap[key] && isRxOrScaledChoice(s)) {
      monthlyMap[key]!.total++;
      if (s.rxOrScaled === "RX") monthlyMap[key]!.rx++;
    }
  });
  const monthlyData = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, val]) => {
      const [year, month] = key.split("-");
      const d = new Date(parseInt(year!, 10), parseInt(month!, 10) - 1, 1);
      return {
        month: d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
        total: val.total,
        rx: val.rx,
      };
    });

  const currentCalendarYear = now.getFullYear();
  let earliestSessionYear = currentCalendarYear;
  if (allSessions.length > 0) {
    earliestSessionYear = Math.min(
      ...allSessions.map(s => new Date(s.workoutDate).getFullYear())
    );
  }
  const availableYears: number[] = [];
  for (let y = currentCalendarYear; y >= earliestSessionYear; y--) {
    availableYears.push(y);
  }

  const sessionCountByYearMonth: Record<number, Record<number, number>> = {};
  allSessions.forEach(s => {
    const d = new Date(s.workoutDate);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    if (!sessionCountByYearMonth[y]) sessionCountByYearMonth[y] = {};
    sessionCountByYearMonth[y][m] = (sessionCountByYearMonth[y][m] ?? 0) + 1;
  });

  const bestMonthByYear: Record<number, { month: number; count: number }> = {};
  for (let y = earliestSessionYear; y <= currentCalendarYear; y++) {
    const byMonth = sessionCountByYearMonth[y];
    let bestMonth = 1;
    let bestCount = 0;
    if (byMonth) {
      for (let m = 1; m <= 12; m++) {
        const c = byMonth[m] ?? 0;
        if (c > bestCount) {
          bestCount = c;
          bestMonth = m;
        }
      }
    }
    bestMonthByYear[y] = { month: bestMonth, count: bestCount };
  }

  const dayOfWeekCounts = new Array(7).fill(0);
  allSessions.forEach(s => {
    dayOfWeekCounts[new Date(s.workoutDate).getDay()]++;
  });
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayOfWeekData = dayNames.map((name, i) => ({ day: name, count: dayOfWeekCounts[i] }));

  let rxLoggedCount = 0;
  let rxOrScaledLoggedCount = 0;
  for (const s of allSessions) {
    if (!isRxOrScaledChoice(s)) continue;
    rxOrScaledLoggedCount++;
    if (s.rxOrScaled === "RX") rxLoggedCount++;
  }
  const rxPercentage =
    rxOrScaledLoggedCount > 0 ? Math.round((100 * rxLoggedCount) / rxOrScaledLoggedCount) : null;

  const healthSessions = allSessions.map(s => ({
    workoutDate: s.workoutDate.toISOString(),
    calories: s.calories,
    maxHeartRate: s.maxHeartRate,
    avgHeartRate: s.avgHeartRate,
    totalDurationSeconds: s.totalDurationSeconds,
  }));

  const stats = {
    currentStreak: streaks.current,
    longestStreak: streaks.longest,
    totalWorkouts: allSessions.length,
    prCount: prSessions.length,
    rolling30Count,
    rxPercentage,
  };

  const recentPrs = prSessions.slice(0, 10).map(s => ({
    id: s.id,
    title: s.title,
    workoutDate: s.workoutDate.toISOString(),
    bestResultDisplay: s.bestResultDisplay,
    rxOrScaled: s.rxOrScaled,
    scoreType: s.scoreType,
  }));

  const sessionSnapshots = allSessions.map(s => ({
    workoutDate: s.workoutDate.toISOString(),
    title: s.title,
    scoreType: s.scoreType,
    rxOrScaled: s.rxOrScaled,
    isPr: s.isPr,
  }));

  return {
    stats,
    healthSessions,
    monthlyData,
    dayOfWeekData,
    recentPrs,
    sessionSnapshots,
    bestMonthByYear,
    availableYears,
  };
}
