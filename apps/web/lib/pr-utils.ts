import { prisma } from "./prisma";

/**
 * Recomputes isPr for every session in a workout group.
 *
 * Only the current best in the group is marked PR: the chronologically latest
 * session among those tied for the best numeric result (min time, max load /
 * reps / etc.). Earlier sessions that were once a personal best are cleared.
 * Sessions without bestResultRaw are never PRs.
 *
 * Groups mirror recalculate-prs logic:
 *   - Template-linked sessions: same userId + workoutTemplateId + scoreType
 *   - Free-form sessions:       same userId + title (case-insensitive) + scoreType
 *
 * Call this after any mutation that may affect the group (create, update, delete).
 * It is safe to call multiple times; it is idempotent.
 */
export async function recomputePrsForWorkout(params: {
  userId: string;
  workoutTemplateId: string | null;
  title: string;
  scoreType: string;
}): Promise<void> {
  const { userId, workoutTemplateId, title, scoreType } = params;
  const isTimeBased = scoreType === "Time";

  const sessions = await prisma.workoutSession.findMany({
    where: {
      userId,
      scoreType,
      ...(workoutTemplateId
        ? { workoutTemplateId }
        : { title: { equals: title, mode: "insensitive" } }),
    },
    orderBy: [{ workoutDate: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      bestResultRaw: true,
      isPr: true,
      workoutDate: true,
      createdAt: true,
    },
  });

  const withRaw = sessions.filter((s) => s.bestResultRaw !== null);
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
    const nextPr = s.bestResultRaw !== null && s.id === prId;
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
