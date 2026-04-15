import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildLeaderboardClientProps } from "@/lib/leaderboard-view-model";
import { StatsHubClient } from "@/components/features/stats/stats-hub-client";

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const [allSessions, profile] = await Promise.all([
    prisma.workoutSession.findMany({
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
        calories: true,
        maxHeartRate: true,
        avgHeartRate: true,
        totalDurationSeconds: true,
      },
    }),
    prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: { preferredUnit: true },
    }),
  ]);

  const leaderboard = buildLeaderboardClientProps(allSessions);

  const titleCounts = new Map<string, number>();
  for (const s of allSessions) {
    if (!s.title) continue;
    titleCounts.set(s.title, (titleCounts.get(s.title) ?? 0) + 1);
  }
  const workoutTitles = [...titleCounts.keys()].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" })
  );
  let maxSessionsForTitle = 0;
  for (const c of titleCounts.values()) {
    maxSessionsForTitle = Math.max(maxSessionsForTitle, c);
  }
  const defaultProgressTitle =
    workoutTitles.length === 0
      ? ""
      : workoutTitles
          .filter(t => (titleCounts.get(t) ?? 0) === maxSessionsForTitle)
          .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))[0] ?? "";

  const prsForClient = allSessions.filter(s => s.isPr).slice(0, 50).map(p => ({
    id: p.id,
    title: p.title,
    workoutDate: p.workoutDate.toISOString(),
    bestResultDisplay: p.bestResultDisplay,
    scoreType: p.scoreType,
    rxOrScaled: p.rxOrScaled,
  }));

  const summary = {
    totalSessions: allSessions.length,
    prCount: allSessions.filter(s => s.isPr).length,
    recentCount: leaderboard.stats.rolling30Count,
  };

  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading stats…</p>}>
      <StatsHubClient
        leaderboard={leaderboard}
        analytics={{
          initialPrs: prsForClient,
          workoutTitles,
          defaultProgressTitle,
          summary,
          preferredUnit: profile?.preferredUnit ?? "metric",
        }}
      />
    </Suspense>
  );
}
