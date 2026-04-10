import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WorkoutsPageClient } from "./workouts-client";

export default async function WorkoutsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const sessions = await prisma.workoutSession.findMany({
    where: { userId: session.user.id },
    orderBy: { workoutDate: "desc" },
    take: 500,
    include: { workoutTemplate: true },
  });

  const sessionsForClient = sessions.map((s) => ({
    id: s.id,
    title: s.title,
    workoutDate: s.workoutDate.toISOString(),
    bestResultDisplay: s.bestResultDisplay,
    scoreType: s.scoreType,
    rxOrScaled: s.rxOrScaled,
    isPr: s.isPr,
  }));

  return (
    <Suspense>
      <WorkoutsPageClient
        sessions={sessionsForClient}
        userId={session.user.id}
      />
    </Suspense>
  );
}
