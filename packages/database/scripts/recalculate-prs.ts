/**
 * Recalculates isPr for every workout session and, for Load-type sessions
 * stored in the old "225 x 5" display format, migrates them to the current
 * 1RM-based format so PR comparison is consistent.
 *
 * Usage:
 *   DATABASE_URL=... npx tsx packages/database/scripts/recalculate-prs.ts
 * Or: npm run db:recalculate-prs
 *
 * Import from other scripts:
 *   import { recalculateAllPrs } from "./recalculate-prs";
 *   await recalculateAllPrs(prisma);
 */

import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

function epleyOneRepMax(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

function roundOneRepMax(value: number): number {
  return Math.round(value * 2) / 2;
}

function parseOldLoadDisplay(display: string): { weight: number; reps: number } | null {
  const match = display.trim().match(/^(\d+(?:\.\d+)?)\s*x\s*(\d+)$/i);
  if (!match) return null;
  const weight = parseFloat(match[1]!);
  const reps = parseInt(match[2]!, 10);
  if (isNaN(weight) || isNaN(reps) || weight <= 0 || reps <= 0) return null;
  return { weight, reps };
}

function bestRmFromSetDetails(sd: unknown): number | null {
  if (!sd || typeof sd !== "object") return null;
  const o = sd as Record<string, unknown>;
  if (Array.isArray(o.sets)) {
    let best = 0;
    for (const row of o.sets) {
      if (row && typeof row === "object") {
        const r = row as { weight?: unknown; reps?: unknown };
        const w = Number(r.weight);
        const rep = Number(r.reps) || 1;
        if (!isNaN(w) && w > 0 && rep > 0) {
          const rm = roundOneRepMax(epleyOneRepMax(w, rep));
          if (rm > best) best = rm;
        }
      }
    }
    return best > 0 ? best : null;
  }
  if (typeof o.weight === "number" && typeof o.reps === "number") {
    return roundOneRepMax(epleyOneRepMax(o.weight, o.reps));
  }
  return null;
}

/**
 * Repair Load rows and recompute isPr for all users. Safe to run after CSV import.
 */
export async function recalculateAllPrs(db: PrismaClient): Promise<void> {
  const oldFormatSessions = await db.workoutSession.findMany({
    where: {
      scoreType: "Load",
      setDetails: { equals: Prisma.DbNull },
      bestResultDisplay: { not: null },
    },
    select: { id: true, bestResultDisplay: true, bestResultRaw: true },
  });

  let repairedCount = 0;
  for (const s of oldFormatSessions) {
    if (!s.bestResultDisplay) continue;
    const parsed = parseOldLoadDisplay(s.bestResultDisplay);
    if (!parsed) continue;

    const { weight, reps } = parsed;
    const oneRM = roundOneRepMax(epleyOneRepMax(weight, reps));

    await db.workoutSession.update({
      where: { id: s.id },
      data: {
        setDetails: { weight, reps },
        bestResultDisplay: String(oneRM),
        bestResultRaw: oneRM,
      },
    });
    repairedCount++;
  }

  console.log(`✅  Repaired ${repairedCount} Load session(s) from old "N x M" format to 1RM`);

  const setDetailsSessions = await db.workoutSession.findMany({
    where: {
      scoreType: "Load",
      setDetails: { not: null },
    },
    select: { id: true, setDetails: true, bestResultRaw: true, bestResultDisplay: true },
  });

  let sdRepairedCount = 0;
  for (const s of setDetailsSessions) {
    const expectedRM = bestRmFromSetDetails(s.setDetails);
    if (expectedRM === null) continue;

    const currentRaw = s.bestResultRaw;
    if (currentRaw === null || Math.abs(currentRaw - expectedRM) > 0.1) {
      await db.workoutSession.update({
        where: { id: s.id },
        data: {
          bestResultRaw: expectedRM,
          bestResultDisplay: String(expectedRM),
        },
      });
      sdRepairedCount++;
    }
  }

  if (sdRepairedCount > 0) {
    console.log(`✅  Fixed bestResultRaw for ${sdRepairedCount} Load session(s) with setDetails`);
  }

  const allSessions = await db.workoutSession.findMany({
    orderBy: [{ userId: "asc" }, { workoutDate: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      userId: true,
      title: true,
      workoutTemplateId: true,
      scoreType: true,
      bestResultRaw: true,
      isPr: true,
    },
  });

  function groupKey(s: {
    userId: string;
    title: string;
    workoutTemplateId: string | null;
    scoreType: string | null;
  }): string {
    const scoreKey = s.scoreType ?? "";
    if (s.workoutTemplateId) {
      return `template:${s.userId}:${s.workoutTemplateId}:${scoreKey}`;
    }
    return `freeform:${s.userId}:${s.title.toLowerCase()}:${scoreKey}`;
  }

  const runningBest = new Map<string, number>();
  const updates: Array<{ id: string; isPr: boolean }> = [];

  for (const s of allSessions) {
    if (s.bestResultRaw === null) {
      if (s.isPr) updates.push({ id: s.id, isPr: false });
      continue;
    }

    const key = groupKey(s);
    const isTimeBased = s.scoreType === "Time";
    const prev = runningBest.get(key);

    let isPr: boolean;
    if (prev === undefined) {
      isPr = true;
    } else {
      isPr = isTimeBased ? s.bestResultRaw < prev : s.bestResultRaw > prev;
    }

    if (isPr) {
      runningBest.set(key, s.bestResultRaw);
    }

    if (isPr !== s.isPr) {
      updates.push({ id: s.id, isPr });
    }
  }

  if (updates.length > 0) {
    await db.$transaction(
      updates.map(({ id, isPr }) =>
        db.workoutSession.update({ where: { id }, data: { isPr } })
      )
    );
  }

  const prGains = updates.filter((u) => u.isPr).length;
  const prLosses = updates.filter((u) => !u.isPr).length;
  console.log(
    `✅  isPr recalculated: ${updates.length} session(s) changed` +
      ` (+${prGains} gained PR, -${prLosses} lost PR)`
  );
}

async function main() {
  console.log("🔧  Starting PR recalculation…\n");
  try {
    await recalculateAllPrs(prisma);
  } finally {
    console.log("\n✨  Done!");
  }
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
