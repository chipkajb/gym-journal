import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LeaderboardsClient } from "./leaderboards-client";

function calcStreak(dates: Date[]): { current: number; longest: number } {
  if (dates.length === 0) return { current: 0, longest: 0 };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const uniqueDays = [...new Set(dates.map(d => {
    const day = new Date(d);
    day.setHours(0, 0, 0, 0);
    return day.toISOString();
  }))].map(s => new Date(s)).sort((a, b) => b.getTime() - a.getTime());

  // Current streak
  let current = 0;
  if (uniqueDays[0].getTime() === today.getTime() || uniqueDays[0].getTime() === yesterday.getTime()) {
    current = 1;
    for (let i = 1; i < uniqueDays.length; i++) {
      const diff = (uniqueDays[i-1].getTime() - uniqueDays[i].getTime()) / (1000 * 60 * 60 * 24);
      if (diff === 1) current++;
      else break;
    }
  }

  // Longest streak
  let longest = 0;
  let runLength = 1;
  for (let i = 1; i < uniqueDays.length; i++) {
    const diff = (uniqueDays[i-1].getTime() - uniqueDays[i].getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      runLength++;
      longest = Math.max(longest, runLength);
    } else {
      runLength = 1;
    }
  }
  longest = Math.max(longest, current, runLength);

  return { current, longest };
}

export default async function LeaderboardsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const allSessions = await prisma.workoutSession.findMany({
    where: { userId: session.user.id },
    orderBy: { workoutDate: "desc" },
    select: {
      id: true,
      title: true,
      workoutDate: true,
      rxOrScaled: true,
      isPr: true,
      scoreType: true,
      bestResultDisplay: true,
      bestResultRaw: true,
    },
  });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const thisMonthSessions = allSessions.filter(s => s.workoutDate >= startOfMonth);
  const thisYearSessions = allSessions.filter(s => s.workoutDate >= startOfYear);

  const rxSessions = allSessions.filter(s => s.rxOrScaled === "RX");
  const rxRate = allSessions.length > 0 ? Math.round((rxSessions.length / allSessions.length) * 100) : 0;

  const prSessions = allSessions.filter(s => s.isPr);

  const streaks = calcStreak(allSessions.map(s => s.workoutDate));

  // Monthly breakdown (last 12 months)
  const monthlyMap: Record<string, { total: number; rx: number }> = {};
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyMap[key] = { total: 0, rx: 0 };
  }
  allSessions.forEach(s => {
    const d = new Date(s.workoutDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (monthlyMap[key]) {
      monthlyMap[key].total++;
      if (s.rxOrScaled === "RX") monthlyMap[key].rx++;
    }
  });
  const monthlyData = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, val]) => {
      const [year, month] = key.split("-");
      const d = new Date(parseInt(year), parseInt(month) - 1, 1);
      return {
        month: d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
        total: val.total,
        rx: val.rx,
      };
    });

  // Best month
  const bestMonthEntry = Object.entries(monthlyMap).reduce((best, [key, val]) => {
    return val.total > (best[1]?.total ?? 0) ? [key, val] : best;
  }, ["", { total: 0, rx: 0 }] as [string, { total: number; rx: number }]);

  let bestMonthLabel = "—";
  if (bestMonthEntry[0]) {
    const [year, month] = bestMonthEntry[0].split("-");
    const d = new Date(parseInt(year), parseInt(month) - 1, 1);
    bestMonthLabel = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }

  // Workout frequency by day of week
  const dayOfWeekCounts = new Array(7).fill(0);
  allSessions.forEach(s => {
    const day = new Date(s.workoutDate).getDay();
    dayOfWeekCounts[day]++;
  });
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayOfWeekData = dayNames.map((name, i) => ({ day: name, count: dayOfWeekCounts[i] }));

  // Unique workouts done
  const uniqueWorkouts = new Set(allSessions.map(s => s.title)).size;

  const stats = {
    currentStreak: streaks.current,
    longestStreak: streaks.longest,
    totalWorkouts: allSessions.length,
    thisMonthCount: thisMonthSessions.length,
    thisYearCount: thisYearSessions.length,
    prCount: prSessions.length,
    rxRate,
    uniqueWorkouts,
    bestMonthLabel,
    bestMonthCount: bestMonthEntry[1]?.total ?? 0,
  };

  const recentPrs = prSessions.slice(0, 10).map(s => ({
    id: s.id,
    title: s.title,
    workoutDate: s.workoutDate.toISOString(),
    bestResultDisplay: s.bestResultDisplay,
    rxOrScaled: s.rxOrScaled,
    scoreType: s.scoreType,
  }));

  return (
    <LeaderboardsClient
      stats={stats}
      monthlyData={monthlyData}
      dayOfWeekData={dayOfWeekData}
      recentPrs={recentPrs}
    />
  );
}
