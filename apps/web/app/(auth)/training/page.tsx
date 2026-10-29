import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TrainingHubClient } from "@/components/features/training/training-hub-client";

type TemplateSession = {
  id: string;
  workoutDate: string;
  bestResultRaw: number | null;
  bestResultDisplay: string | null;
  rxOrScaled: string | null;
  isPr: boolean;
  scoreType: string;
  notes: string | null;
};

export default async function TrainingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  // One flat query; template histories are grouped in memory instead of a nested
  // per-template fetch, and templates are serialized once for both tabs.
  const [sessions, templateRows] = await Promise.all([
    prisma.workoutSession.findMany({
      where: { userId: session.user.id },
      orderBy: { workoutDate: "desc" },
      select: {
        id: true,
        title: true,
        workoutTemplateId: true,
        workoutDate: true,
        bestResultRaw: true,
        bestResultDisplay: true,
        rxOrScaled: true,
        isPr: true,
        scoreType: true,
        notes: true,
      },
    }),
    prisma.workoutTemplate.findMany({
      where: { userId: session.user.id },
      select: { id: true, title: true, description: true, scoreType: true },
      orderBy: { title: "asc" },
    }),
  ]);

  const historyByTemplate = new Map<string, TemplateSession[]>();
  const sessionsForWorkouts = sessions.map((s) => {
    const workoutDate = s.workoutDate.toISOString();
    if (s.workoutTemplateId) {
      const list = historyByTemplate.get(s.workoutTemplateId) ?? [];
      list.push({
        id: s.id,
        workoutDate,
        bestResultRaw: s.bestResultRaw,
        bestResultDisplay: s.bestResultDisplay,
        rxOrScaled: s.rxOrScaled,
        isPr: s.isPr,
        scoreType: s.scoreType,
        notes: s.notes,
      });
      historyByTemplate.set(s.workoutTemplateId, list);
    }
    return {
      id: s.id,
      title: s.title,
      workoutDate,
      bestResultDisplay: s.bestResultDisplay,
      scoreType: s.scoreType,
      rxOrScaled: s.rxOrScaled,
      isPr: s.isPr,
    };
  });

  const templates = templateRows.map((t) => ({ ...t, sessions: historyByTemplate.get(t.id) ?? [] }));

  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-muted" />}>
      <TrainingHubClient
        templates={templates}
        sessionsForWorkouts={sessionsForWorkouts}
        userId={session.user.id}
      />
    </Suspense>
  );
}
