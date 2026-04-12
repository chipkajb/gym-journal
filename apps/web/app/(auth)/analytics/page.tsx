import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AnalyticsPageClient } from "./analytics-page-client";

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const [prs, summary, titleRows, profile] = await Promise.all([
    prisma.workoutSession.findMany({
      where: { userId: session.user.id, isPr: true },
      orderBy: { workoutDate: "desc" },
      take: 50,
      include: { workoutTemplate: true },
    }),
    (async () => {
      const [totalSessions, prCount, recentCount] = await Promise.all([
        prisma.workoutSession.count({ where: { userId: session.user.id } }),
        prisma.workoutSession.count({
          where: { userId: session.user.id, isPr: true },
        }),
        prisma.workoutSession.count({
          where: {
            userId: session.user.id,
            workoutDate: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
        }),
      ]);
      return { totalSessions, prCount, recentCount };
    })(),
    prisma.workoutSession.groupBy({
      by: ["title"],
      where: { userId: session.user.id },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    }),
    prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: { preferredUnit: true },
    }),
  ]);

  const prsForClient = prs.map((p) => ({
    id: p.id,
    title: p.title,
    workoutDate: p.workoutDate.toISOString(),
    bestResultDisplay: p.bestResultDisplay,
    scoreType: p.scoreType,
    rxOrScaled: p.rxOrScaled,
  }));

  const workoutTitles = titleRows.map((r) => r.title).filter(Boolean);

  return (
    <AnalyticsPageClient
      initialPrs={prsForClient}
      workoutTitles={workoutTitles}
      summary={summary}
      preferredUnit={profile?.preferredUnit ?? "metric"}
    />
  );
}
