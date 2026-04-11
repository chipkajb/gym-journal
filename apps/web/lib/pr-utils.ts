import { prisma } from "./prisma";

/**
 * Recomputes isPr for every session in a workout group by walking them
 * chronologically and tracking the running best result.
 *
 * A session is a PR when its bestResultRaw beats every prior session in the
 * same group: lower is better for Time, higher is better for everything else.
 * Sessions without a bestResultRaw (no numeric result) are never PRs.
 *
 * Groups mirror the detectIsPr / recalculate-prs logic:
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
  scoreType: string | null;
}): Promise<void> {
  const { userId, workoutTemplateId, title, scoreType } = params;
  const isTimeBased = scoreType === "Time";

  const sessions = await prisma.workoutSession.findMany({
    where: {
      userId,
      scoreType: scoreType ?? null,
      ...(workoutTemplateId
        ? { workoutTemplateId }
        : { title: { equals: title, mode: "insensitive" } }),
    },
    orderBy: [{ workoutDate: "asc" }, { createdAt: "asc" }],
    select: { id: true, bestResultRaw: true, isPr: true },
  });

  let runningBest: number | null = null;
  const updates: Array<{ id: string; isPr: boolean }> = [];

  for (const s of sessions) {
    if (s.bestResultRaw === null) {
      if (s.isPr) updates.push({ id: s.id, isPr: false });
      continue;
    }

    let isPr: boolean;
    if (runningBest === null) {
      isPr = true; // first result in the group
    } else {
      isPr = isTimeBased ? s.bestResultRaw < runningBest : s.bestResultRaw > runningBest;
    }

    // Advance the running best whenever this session sets a new record
    if (isPr) runningBest = s.bestResultRaw;

    if (isPr !== s.isPr) {
      updates.push({ id: s.id, isPr });
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
