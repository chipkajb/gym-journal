/**
 * Clears all workout-related data (sessions and templates).
 * Preserves users, accounts, sessions, profiles, exercises, device_*.
 * Run this before re-importing workout data or when resetting to the new schema.
 *
 * Usage: from repo root, ensure DATABASE_URL is set, then:
 *   npx tsx packages/database/scripts/clear-workout-data.ts
 * Or: npm run db:clear-workouts (if added to package.json)
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Clearing workout sessions and templates...");

  const deletedSessions = await prisma.workoutSession.deleteMany({});
  const deletedTemplates = await prisma.workoutTemplate.deleteMany({});

  console.log(`Deleted ${deletedSessions.count} workout session(s) and ${deletedTemplates.count} template(s).`);
  console.log("Done. Users and other data are unchanged.");
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
