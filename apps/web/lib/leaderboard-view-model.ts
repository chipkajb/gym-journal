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
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const rolling30Cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const thisMonthSessions = allSessions.filter(s => s.workoutDate >= startOfMonth);
  const thisYearSessions = allSessions.filter(s => s.workoutDate >= startOfYear);
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

  const allTimeMonthlyMap: Record<string, number> = {};
  allSessions.forEach(s => {
    const d = new Date(s.workoutDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    allTimeMonthlyMap[key] = (allTimeMonthlyMap[key] ?? 0) + 1;
  });
  let bestMonthKey = "";
  let bestMonthCount = 0;
  for (const [key, count] of Object.entries(allTimeMonthlyMap)) {
    if (count > bestMonthCount) {
      bestMonthCount = count;
      bestMonthKey = key;
    }
  }
  let bestMonthLabel = "—";
  if (bestMonthKey) {
    const [year, month] = bestMonthKey.split("-");
    const d = new Date(parseInt(year!, 10), parseInt(month!, 10) - 1, 1);
    bestMonthLabel = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }

  const dayOfWeekCounts = new Array(7).fill(0);
  allSessions.forEach(s => {
    dayOfWeekCounts[new Date(s.workoutDate).getDay()]++;
  });
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayOfWeekData = dayNames.map((name, i) => ({ day: name, count: dayOfWeekCounts[i] }));

  const uniqueWorkouts = new Set(allSessions.map(s => s.title)).size;

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
    thisMonthCount: thisMonthSessions.length,
    thisYearCount: thisYearSessions.length,
    prCount: prSessions.length,
    uniqueWorkouts,
    bestMonthLabel,
    bestMonthCount,
    rolling30Count,
  };

  const recentPrs = prSessions.slice(0, 10).map(s => ({
    id: s.id,
    title: s.title,
    workoutDate: s.workoutDate.toISOString(),
    bestResultDisplay: s.bestResultDisplay,
    rxOrScaled: s.rxOrScaled,
    scoreType: s.scoreType,
  }));

  const sessionPrRows = allSessions.map(s => ({
    workoutDate: s.workoutDate.toISOString(),
    isPr: s.isPr,
  }));

  return {
    stats,
    healthSessions,
    monthlyData,
    dayOfWeekData,
    recentPrs,
    sessionPrRows,
  };
}
