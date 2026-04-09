import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WodClient } from "./wod-client";

export default async function WodPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  // Load all templates with their session history
  const templates = await prisma.workoutTemplate.findMany({
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
  });

  const templatesForClient = templates.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    scoreType: t.scoreType,
    barbellLift: t.barbellLift,
    sessions: t.workoutSessions.map((s) => ({
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

  return <WodClient templates={templatesForClient} />;
}
