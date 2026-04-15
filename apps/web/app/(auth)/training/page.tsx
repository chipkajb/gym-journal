import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TrainingHubClient } from "@/components/features/training/training-hub-client";

export default async function TrainingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const [sessions, templates] = await Promise.all([
    prisma.workoutSession.findMany({
      where: { userId: session.user.id },
      orderBy: { workoutDate: "desc" },
      take: 500,
      include: { workoutTemplate: true },
    }),
    prisma.workoutTemplate.findMany({
      where: { userId: session.user.id },
      include: {
        workoutSessions: {
          where: { userId: session.user.id },
          orderBy: { workoutDate: "desc" },
          select: {
            id: true,
            workoutDate: true,
            bestResultRaw: true,
            bestResultDisplay: true,
            rxOrScaled: true,
            isPr: true,
            scoreType: true,
            notes: true,
          },
        },
      },
      orderBy: { title: "asc" },
    }),
  ]);

  const sessionsForWorkouts = sessions.map(s => ({
    id: s.id,
    title: s.title,
    workoutDate: s.workoutDate.toISOString(),
    bestResultDisplay: s.bestResultDisplay,
    scoreType: s.scoreType,
    rxOrScaled: s.rxOrScaled,
    isPr: s.isPr,
  }));

  const wodTemplates = templates.map(t => ({
    id: t.id,
    title: t.title,
    description: t.description,
    scoreType: t.scoreType,
    sessions: t.workoutSessions.map(s => ({
      id: s.id,
      workoutDate: s.workoutDate.toISOString(),
      bestResultRaw: s.bestResultRaw,
      bestResultDisplay: s.bestResultDisplay,
      rxOrScaled: s.rxOrScaled,
      isPr: s.isPr,
      scoreType: s.scoreType,
      notes: s.notes,
    })),
  }));

  const libraryTemplates = templates.map(t => ({
    id: t.id,
    title: t.title,
    scoreType: t.scoreType,
    sessions: t.workoutSessions.map(s => ({
      id: s.id,
      workoutDate: s.workoutDate.toISOString(),
      bestResultDisplay: s.bestResultDisplay,
      bestResultRaw: s.bestResultRaw,
      rxOrScaled: s.rxOrScaled,
      isPr: s.isPr,
      scoreType: s.scoreType,
      notes: s.notes,
    })),
  }));

  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
      <TrainingHubClient
        wodTemplates={wodTemplates}
        sessionsForWorkouts={sessionsForWorkouts}
        libraryTemplates={libraryTemplates}
        userId={session.user.id}
      />
    </Suspense>
  );
}
