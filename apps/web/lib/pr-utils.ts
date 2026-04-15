import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

/**
 * Sessions that may hold the single PR for a group.
 * - Load: no RX/Scaled field — all sessions with a numeric score compete.
 * - Other score types: only RX (scaled never earns PR).
 */
export function isPrEligible(scoreType: string, rxOrScaled: string | null): boolean {
  if (scoreType === "Load") return true;
  return rxOrScaled === "RX";
}

/**
 * Where clause for all sessions that compete for the same PR line
 * (template-linked + same-title free-form + free-form title matching a template name).
 */
export function buildPrGroupWhere(
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

/**
 * Recomputes isPr for every session in a workout group.
 *
 * Only the current best in the group is marked PR: the chronologically latest
 * session among those tied for the best numeric result (min time, max load /
 * reps / etc.). Earlier sessions that were once a personal best are cleared.
 * Sessions without bestResultRaw are never PRs. Scaled (non-load) workouts
 * never earn PR.
 *
 * Groups include template sessions and same-title free-form so analytics
 * charts stay consistent with stored flags.
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

const EPS = 1e-6;

/**
 * True if the new result strictly beats the prior best (not a tie).
 * Time: lower is better. Other score types: higher is better.
 */
export function strictlyBeatsPriorBest(
  scoreType: string,
  priorBest: number,
  newRaw: number
): boolean {
  if (scoreType === "Time") {
    return newRaw < priorBest - EPS;
  }
  return newRaw > priorBest + EPS;
}

/**
 * Whether logging this session deserves a "new PR" celebration (first PR in group,
 * or strictly better than any prior eligible result — not a tie).
 */
export function shouldCelebrateStrictNewPr(params: {
  scoreType: string;
  sessionIsPr: boolean;
  bestResultRaw: number | null;
  rxOrScaled: string | null;
  priorBestAmongEligible: number | null;
}): boolean {
  const { scoreType, sessionIsPr, bestResultRaw, rxOrScaled, priorBestAmongEligible } = params;
  if (!sessionIsPr || bestResultRaw === null || !isPrEligible(scoreType, rxOrScaled)) {
    return false;
  }
  if (priorBestAmongEligible === null) {
    return true;
  }
  return strictlyBeatsPriorBest(scoreType, priorBestAmongEligible, bestResultRaw);
}
