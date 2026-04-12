/**
 * Imports workouts from workouts.csv into the database.
 * - Clears existing workout sessions and templates for the target user.
 * - Creates one WorkoutTemplate per distinct workout title (first occurrence's description/scoreType).
 * - Creates one WorkoutSession per CSV row, linked to template when title matches.
 *
 * Expects workouts.csv at repo root or path in WORKOUTS_CSV env.
 * Uses the first user in the DB as owner unless WORKOUT_USER_ID is set.
 *
 * Usage (from repo root, DATABASE_URL set):
 *   npx tsx packages/database/scripts/import-workouts.ts
 * Or: npm run db:import-workouts
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

type CsvRow = {
  date: string;
  title: string;
  description: string;
  best_result_raw: string;
  best_result_display: string;
  score_type: string;
  barbell_lift: string;
  set_details: string;
  notes: string;
  rx_or_scaled: string;
  pr: string;
};

// Parse full CSV content, correctly handling quoted fields that contain commas and newlines.
function parseCsv(content: string): CsvRow[] {
  // Tokenize the entire file character-by-character so quoted newlines are preserved.
  const records: string[][] = [];
  let currentRecord: string[] = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const c = content[i];
    const next = content[i + 1];

    if (c === '"') {
      if (inQuotes && next === '"') {
        // Escaped double-quote inside a quoted field
        currentField += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === "," && !inQuotes) {
      currentRecord.push(currentField);
      currentField = "";
    } else if ((c === "\n" || (c === "\r" && next === "\n")) && !inQuotes) {
      if (c === "\r") i++; // skip the \n of \r\n
      currentRecord.push(currentField);
      currentField = "";
      if (currentRecord.some((f) => f.length > 0)) {
        records.push(currentRecord);
      }
      currentRecord = [];
    } else {
      currentField += c;
    }
  }
  // Flush last record
  currentRecord.push(currentField);
  if (currentRecord.some((f) => f.length > 0)) {
    records.push(currentRecord);
  }

  if (records.length < 2) return [];
  const header = records[0];
  const rows: CsvRow[] = [];
  for (let i = 1; i < records.length; i++) {
    const values = records[i];
    const row: Record<string, string> = {};
    header.forEach((h, j) => {
      row[h.trim()] = (values[j] ?? "").trim();
    });
    rows.push(row as unknown as CsvRow);
  }
  return rows;
}

function parseDate(mmDdYyyy: string): Date {
  const [m, d, y] = mmDdYyyy.split("/").map(Number);
  if (!m || !d || !y) return new Date();
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

function parseSetDetails(raw: string): unknown {
  if (!raw || !raw.trim()) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

function parseFloatSafe(s: string): number | null {
  const n = parseFloat(s);
  return Number.isNaN(n) ? null : n;
}

async function main() {
  // Resolve CSV path: env, then repo root (cwd or two levels up from this script)
  const repoRoot = process.cwd().endsWith("packages/database")
    ? path.join(process.cwd(), "..", "..")
    : process.cwd();
  const csvPath =
    process.env.WORKOUTS_CSV || path.join(repoRoot, "workouts.csv");
  if (!fs.existsSync(csvPath)) {
    console.error("CSV not found at", csvPath);
    process.exit(1);
  }

  const userId =
    process.env.WORKOUT_USER_ID ||
    (await prisma.user.findFirst().then((u) => u?.id));
  if (!userId) {
    console.error("No user found. Create an account first or set WORKOUT_USER_ID.");
    process.exit(1);
  }

  console.log("Clearing existing workout data for user...");
  await prisma.workoutSession.deleteMany({ where: { userId } });
  await prisma.workoutTemplate.deleteMany({ where: { userId } });

  const content = fs.readFileSync(csvPath, "utf-8");
  const rows = parseCsv(content);
  console.log(`Parsed ${rows.length} rows from ${csvPath}`);

  // Build unique templates by title (first occurrence wins for description/scoreType)
  const templateByTitle = new Map<string, { title: string; description: string; scoreType: string }>();
  for (const r of rows) {
    const t = r.title?.trim();
    if (!t) continue;
    if (!templateByTitle.has(t)) {
      const st = r.score_type?.trim() || "Time";
      templateByTitle.set(t, {
        title: t,
        description: r.description?.trim() ?? "",
        scoreType: ["Time", "Reps", "Load", "Rounds + Reps"].includes(st) ? st : "Time",
      });
    }
  }

  const createdTemplates = await prisma.workoutTemplate.createMany({
    data: Array.from(templateByTitle.values()).map((v) => ({
      userId,
      title: v.title,
      description: v.description || null,
      scoreType: v.scoreType,
    })),
  });
  console.log(`Created ${createdTemplates.count} templates`);

  const templates = await prisma.workoutTemplate.findMany({
    where: { userId },
    select: { id: true, title: true },
  });
  const templateIdByTitle = new Map(templates.map((t) => [t.title, t.id]));

  let created = 0;
  for (const r of rows) {
    const title = r.title?.trim();
    if (!title) continue;
    const workoutDate = parseDate(r.date);
    const bestResultRaw = parseFloatSafe(r.best_result_raw);
    const setDetails = parseSetDetails(r.set_details);
    const isPr = /^PR$/i.test(r.pr?.trim() ?? "");

    const st = r.score_type?.trim() || "Time";
    const scoreType = ["Time", "Reps", "Load", "Rounds + Reps"].includes(st) ? st : "Time";
    await prisma.workoutSession.create({
      data: {
        userId,
        workoutTemplateId: templateIdByTitle.get(title) ?? null,
        title,
        description: r.description?.trim() || null,
        workoutDate,
        bestResultRaw,
        bestResultDisplay: r.best_result_display?.trim() || null,
        scoreType,
        setDetails: setDetails as object | null,
        notes: r.notes?.trim() || null,
        rxOrScaled: scoreType === "Load" ? null : r.rx_or_scaled?.trim() || null,
        isPr,
      },
    });
    created++;
  }

  console.log(`Created ${created} workout sessions. Import done.`);
  console.log("Run: npm run db:recalculate-prs — to repair Load rows and recompute isPr.");
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
