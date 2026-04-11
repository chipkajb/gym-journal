/**
 * Recalculates isPr for every workout session and, for Load-type sessions
 * stored in the old "225 x 5" display format, migrates them to the current
 * 1RM-based format so PR comparison is consistent.
 *
 * Algorithm for isPr:
 *   - Group sessions by (userId, workoutTemplateId) when a template exists,
 *     otherwise by (userId, title [case-insensitive]) + scoreType.
 *   - Within each group, sort chronologically (oldest first).
 *   - Track the running best bestResultRaw.
 *   - Mark isPr = true whenever the session beats the running best
 *     (lower for Time, higher for everything else).
 *   - Sessions with null bestResultRaw are left as isPr = false.
 *
 * Load-type data repair:
 *   Old sessions store display = "225 x 5" and bestResultRaw = raw weight.
 *   New sessions store display = "262.5" (1RM) and have setDetails JSON.
 *   This script detects old-format records (no setDetails, display = "N x M"),
 *   back-fills setDetails, recalculates 1RM via Epley's formula, and updates
 *   bestResultDisplay and bestResultRaw so all records are on the same scale.
 *
 * Usage:
 *   DATABASE_URL=... npx tsx packages/database/scripts/recalculate-prs.ts
 * Or via npm:
 *   npm run db:recalculate-prs
 */

import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

// ---------- Epley helpers (mirrors apps/web/lib/workout-utils.ts) ----------

function epleyOneRepMax(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

function roundOneRepMax(value: number): number {
  return Math.round(value * 2) / 2;
}

// ---------- Load-display parser (matches edit-workout-form.tsx) ----------

/**
 * Detects the old "225 x 5" pattern and returns {weight, reps}.
 * Returns null for anything else (already a plain 1RM number, etc.).
 */
function parseOldLoadDisplay(display: string): { weight: number; reps: number } | null {
  const match = display.trim().match(/^(\d+(?:\.\d+)?)\s*x\s*(\d+)$/i);
  if (!match) return null;
  const weight = parseFloat(match[1]!);
  const reps = parseInt(match[2]!, 10);
  if (isNaN(weight) || isNaN(reps) || weight <= 0 || reps <= 0) return null;
  return { weight, reps };
}

// ---------- Main ----------

async function main() {
  console.log("🔧  Starting PR recalculation…\n");

  // ------------------------------------------------------------------ //
  // Step 1 – Repair Load sessions stored in old "N x M" display format  //
  // ------------------------------------------------------------------ //

  const oldFormatSessions = await prisma.workoutSession.findMany({
    where: {
      scoreType: "Load",
      // Use DbNull to match rows where setDetails IS NULL in the database
      setDetails: { equals: Prisma.DbNull },
      bestResultDisplay: { not: null },
    },
    select: { id: true, bestResultDisplay: true, bestResultRaw: true },
  });

  let repairedCount = 0;
  for (const s of oldFormatSessions) {
    if (!s.bestResultDisplay) continue;
    const parsed = parseOldLoadDisplay(s.bestResultDisplay);
    if (!parsed) continue; // already a plain number (1RM) — no repair needed

    const { weight, reps } = parsed;
    const oneRM = roundOneRepMax(epleyOneRepMax(weight, reps));

    await prisma.workoutSession.update({
      where: { id: s.id },
      data: {
        // Store original lift so the edit form can reconstruct weight × reps
        setDetails: { weight, reps },
        // Update display and raw to the 1RM value so comparisons are consistent
        bestResultDisplay: String(oneRM),
        bestResultRaw: oneRM,
      },
    });
    repairedCount++;
  }

  console.log(`✅  Repaired ${repairedCount} Load session(s) from old "N x M" format to 1RM`);

  // ------------------------------------------------------------------ //
  // Step 2 – Also repair Load sessions that have setDetails but whose    //
  //          bestResultRaw was not set to the 1RM (edge case from early  //
  //          versions of the import script).                             //
  // ------------------------------------------------------------------ //

  type SetDetailsShape = { weight?: number; reps?: number } | null;
  const setDetailsSessions = await prisma.workoutSession.findMany({
    where: {
      scoreType: "Load",
      setDetails: { not: null },
    },
    select: { id: true, setDetails: true, bestResultRaw: true, bestResultDisplay: true },
  });

  let sdRepairedCount = 0;
  for (const s of setDetailsSessions) {
    const sd = s.setDetails as SetDetailsShape;
    if (!sd || typeof sd.weight !== "number" || typeof sd.reps !== "number") continue;

    const expectedRM = roundOneRepMax(epleyOneRepMax(sd.weight, sd.reps));
    const currentRaw = s.bestResultRaw;

    // Only update if bestResultRaw differs from the expected 1RM by more than 0.1
    // (tolerance for floating-point rounding)
    if (currentRaw === null || Math.abs(currentRaw - expectedRM) > 0.1) {
      await prisma.workoutSession.update({
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

  // ------------------------------------------------------------------ //
  // Step 3 – Recalculate isPr for all sessions                          //
  // ------------------------------------------------------------------ //

  const allSessions = await prisma.workoutSession.findMany({
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

  /**
   * Grouping key: mirrors detectIsPr() in apps/web/app/api/sessions/route.ts.
   *   - Template-linked sessions: keyed by userId + templateId + scoreType
   *   - Free-form sessions:       keyed by userId + lower-cased title + scoreType
   *
   * scoreType is always part of the key (matching detectIsPr's WHERE clause)
   * so that a template recorded under two different score types doesn't
   * erroneously cross-compare results.
   */
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

  // running best per group
  const runningBest = new Map<string, number>();
  const updates: Array<{ id: string; isPr: boolean }> = [];

  for (const s of allSessions) {
    if (s.bestResultRaw === null) {
      // Can't compare — ensure isPr is false
      if (s.isPr) updates.push({ id: s.id, isPr: false });
      continue;
    }

    const key = groupKey(s);
    const isTimeBased = s.scoreType === "Time";
    const prev = runningBest.get(key);

    let isPr: boolean;
    if (prev === undefined) {
      isPr = true; // first recorded result for this workout
    } else {
      isPr = isTimeBased ? s.bestResultRaw < prev : s.bestResultRaw > prev;
    }

    // Advance the running best when a PR is set
    if (isPr) {
      runningBest.set(key, s.bestResultRaw);
    }

    if (isPr !== s.isPr) {
      updates.push({ id: s.id, isPr });
    }
  }

  // Batch-update in a transaction
  if (updates.length > 0) {
    await prisma.$transaction(
      updates.map(({ id, isPr }) =>
        prisma.workoutSession.update({ where: { id }, data: { isPr } })
      )
    );
  }

  const prGains = updates.filter((u) => u.isPr).length;
  const prLosses = updates.filter((u) => !u.isPr).length;
  console.log(
    `✅  isPr recalculated: ${updates.length} session(s) changed` +
      ` (+${prGains} gained PR, -${prLosses} lost PR)`
  );
  console.log("\n✨  Done!");
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
