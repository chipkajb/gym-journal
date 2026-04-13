/**
 * Recomputes `isPr` for every distinct workout group (merged template + same-title
 * free-form, Load vs RX rules). Idempotent — safe after every deploy.
 *
 * Keep logic aligned with: apps/web/lib/pr-utils.ts
 */
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

function isPrEligible(scoreType: string, rxOrScaled: string | null): boolean {
  if (scoreType === "Load") return true;
  return rxOrScaled === "RX";
}

function buildPrGroupWhere(
  userId: string,
  scoreType: string,
  workoutTemplateId: string | null,
  title: string
): Prisma.WorkoutSessionWhereInput {
  const trimmed = title.trim();
  const titleMatch: Prisma.StringFilter = { equals: trimmed, mode: "insensitive" };
  if (workoutTemplateId) {
    return {
      userId,
      scoreType,
      OR: [
        { workoutTemplateId },
        { workoutTemplateId: null, title: titleMatch },
      ],
    };
  }
  return {
    userId,
    scoreType,
    OR: [
      { workoutTemplateId: null, title: titleMatch },
      {
        workoutTemplate: {
          title: titleMatch,
          userId,
        },
      },
    ],
  };
}

async function recomputePrsForWorkout(params: {
  userId: string;
  workoutTemplateId: string | null;
  title: string;
  scoreType: string;
}): Promise<void> {
  const { userId, workoutTemplateId, title, scoreType } = params;
  const isTimeBased = scoreType === "Time";

  const sessions = await prisma.workoutSession.findMany({
    where: buildPrGroupWhere(userId, scoreType, workoutTemplateId, title),
    orderBy: [{ workoutDate: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      bestResultRaw: true,
      isPr: true,
      workoutDate: true,
      createdAt: true,
      rxOrScaled: true,
    },
  });

  const withRaw = sessions.filter(
    (s) => s.bestResultRaw !== null && isPrEligible(scoreType, s.rxOrScaled)
  );
  let prId: string | null = null;

  if (withRaw.length > 0) {
    const globalBest = withRaw.reduce((acc, s) => {
      const v = s.bestResultRaw!;
      return isTimeBased ? Math.min(acc, v) : Math.max(acc, v);
    }, withRaw[0]!.bestResultRaw!);

    const eps = 1e-6;
    const tied = withRaw.filter((s) => Math.abs(s.bestResultRaw! - globalBest) < eps);

    tied.sort((a, b) => {
      const d = b.workoutDate.getTime() - a.workoutDate.getTime();
      if (d !== 0) return d;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
    prId = tied[0]!.id;
  }

  const updates: Array<{ id: string; isPr: boolean }> = [];

  for (const s of sessions) {
    const nextPr =
      s.bestResultRaw !== null && isPrEligible(scoreType, s.rxOrScaled) && s.id === prId;
    if (nextPr !== s.isPr) {
      updates.push({ id: s.id, isPr: nextPr });
    }
  }

  if (updates.length > 0) {
    await prisma.$transaction(
      updates.map(({ id, isPr }) =>
        prisma.workoutSession.update({ where: { id }, data: { isPr } })
      )
    );
  }
}

async function main() {
  const rows = await prisma.workoutSession.findMany({
    select: {
      userId: true,
      workoutTemplateId: true,
      title: true,
      scoreType: true,
    },
  });

  const seen = new Set<string>();
  let n = 0;
  for (const r of rows) {
    const key = [r.userId, r.workoutTemplateId ?? "∅", r.title, r.scoreType].join("\t");
    if (seen.has(key)) continue;
    seen.add(key);
    await recomputePrsForWorkout({
      userId: r.userId,
      workoutTemplateId: r.workoutTemplateId,
      title: r.title,
      scoreType: r.scoreType,
    });
    n++;
  }

  console.log(
    `✅  Repaired PR flags for ${n} distinct workout group(s) (${rows.length} session(s) scanned).`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
