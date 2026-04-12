/**
 * Seeds curated CrossFit workout templates for the target user.
 * Clears existing templates (but NOT sessions) before inserting.
 *
 * Usage (from repo root, DATABASE_URL set):
 *   npx tsx packages/database/scripts/seed-templates.ts
 * Or:
 *   npm run db:seed-templates   (from packages/database)
 *
 * Set WORKOUT_USER_ID env var to target a specific user, otherwise uses first user found.
 * Set SKIP_CLEAR=1 to skip deleting existing templates.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type TemplateInput = {
  title: string;
  description: string;
  scoreType: "Time" | "Reps" | "Load" | "Rounds + Reps";
};

// ─── "The Girls" benchmark WODs ──────────────────────────────────────────────
const GIRL_WODS: TemplateInput[] = [
  {
    title: "Angie",
    description:
      "For time:\n100 Pull-ups\n100 Push-ups\n100 Sit-ups\n100 Squats\n\nComplete all reps of each movement before moving to the next.",
    scoreType: "Time",
  },
  {
    title: "Barbara",
    description:
      "5 rounds for time:\n20 Pull-ups\n30 Push-ups\n40 Sit-ups\n50 Squats\n\nRest exactly 3 minutes between each round.",
    scoreType: "Time",
  },
  {
    title: "Chelsea",
    description:
      "Each minute on the minute for 30 minutes:\n5 Pull-ups\n10 Push-ups\n15 Squats\n\nIf you cannot complete the work within the minute, stop and record how many complete rounds you finished.",
    scoreType: "Reps",
  },
  {
    title: "Cindy",
    description:
      "20-minute AMRAP:\n5 Pull-ups\n10 Push-ups\n15 Squats",
    scoreType: "Rounds + Reps",
  },
  {
    title: "Diane",
    description:
      "21-15-9 reps for time:\nDeadlift (225/155 lb)\nHandstand Push-ups",
    scoreType: "Time",
  },
  {
    title: "Elizabeth",
    description:
      "21-15-9 reps for time:\nClean (135/95 lb)\nRing Dips",
    scoreType: "Time",
  },
  {
    title: "Fran",
    description:
      "21-15-9 reps for time:\nThruster (95/65 lb)\nPull-ups",
    scoreType: "Time",
  },
  {
    title: "Grace",
    description:
      "30 Clean & Jerks for time\n(135/95 lb)",
    scoreType: "Time",
  },
  {
    title: "Helen",
    description:
      "3 rounds for time:\n400m Run\n21 Kettlebell Swings (53/35 lb)\n12 Pull-ups",
    scoreType: "Time",
  },
  {
    title: "Isabel",
    description:
      "30 Snatches for time\n(135/95 lb)",
    scoreType: "Time",
  },
  {
    title: "Jackie",
    description:
      "For time:\n1000m Row\n50 Thrusters (45/35 lb)\n30 Pull-ups",
    scoreType: "Time",
  },
  {
    title: "Karen",
    description:
      "150 Wall Balls for time\n(20/14 lb to 10/9 ft target)",
    scoreType: "Time",
  },
  {
    title: "Kelly",
    description:
      "5 rounds for time:\n400m Run\n30 Box Jumps (24/20 in)\n30 Wall Balls (20/14 lb)",
    scoreType: "Time",
  },
  {
    title: "Linda",
    description:
      "10-9-8-7-6-5-4-3-2-1 reps for time:\nDeadlift (1.5x bodyweight)\nBench Press (bodyweight)\nClean (0.75x bodyweight)",
    scoreType: "Time",
  },
  {
    title: "Mary",
    description:
      "20-minute AMRAP:\n5 Handstand Push-ups\n10 Pistol Squats (alternating)\n15 Pull-ups",
    scoreType: "Rounds + Reps",
  },
  {
    title: "Nancy",
    description:
      "5 rounds for time:\n400m Run\n15 Overhead Squats (95/65 lb)",
    scoreType: "Time",
  },
];

// ─── Hero WODs ────────────────────────────────────────────────────────────────
const HERO_WODS: TemplateInput[] = [
  {
    title: "Murph",
    description:
      "For time (with 20 lb/14 lb weight vest):\n1-mile Run\n100 Pull-ups\n200 Push-ups\n300 Squats\n1-mile Run\n\nPartition the pull-ups, push-ups, and squats as needed.",
    scoreType: "Time",
  },
  {
    title: "DT",
    description:
      "5 rounds for time:\n12 Deadlifts (155/105 lb)\n9 Hang Power Cleans (155/105 lb)\n6 Push Jerks (155/105 lb)",
    scoreType: "Time",
  },
  {
    title: "JT",
    description:
      "21-15-9 reps for time:\nHandstand Push-ups\nRing Dips\nPush-ups",
    scoreType: "Time",
  },
  {
    title: "Randy",
    description:
      "75 Power Snatches for time\n(75/55 lb)",
    scoreType: "Time",
  },
  {
    title: "Ryan",
    description:
      "5 rounds for time:\n7 Muscle-ups\n21 Burpees",
    scoreType: "Time",
  },
  {
    title: "Holleyman",
    description:
      "30 rounds for time:\n5 Wall Balls (20/14 lb)\n3 Handstand Push-ups\n1 Power Clean (225/155 lb)",
    scoreType: "Time",
  },
  {
    title: "Filthy Fifty",
    description:
      "For time:\n50 Box Jumps (24/20 in)\n50 Jumping Pull-ups\n50 Kettlebell Swings (35/26 lb)\n50 Walking Lunges\n50 Knees to Elbows\n50 Push Press (45/35 lb)\n50 Back Extensions\n50 Wall Balls (20/14 lb)\n50 Burpees\n50 Double-Unders",
    scoreType: "Time",
  },
  {
    title: "The Seven",
    description:
      "7 rounds for time:\n7 Handstand Push-ups\n7 Thrusters (135/95 lb)\n7 Knees to Elbows\n7 Deadlifts (245/165 lb)\n7 Burpees\n7 Kettlebell Swings (70/53 lb)\n7 Pull-ups",
    scoreType: "Time",
  },
  {
    title: "Nate",
    description:
      "20-minute AMRAP:\n2 Muscle-ups\n4 Handstand Push-ups\n8 Kettlebell Swings (70/53 lb)",
    scoreType: "Rounds + Reps",
  },
  {
    title: "Josh",
    description:
      "21-15-9 reps for time:\nOverhead Squat (95/65 lb)\nLeaning Rest",
    scoreType: "Time",
  },
];

// ─── Benchmark Strength Tests ─────────────────────────────────────────────────
const STRENGTH_TESTS: TemplateInput[] = [
  {
    title: "Max Back Squat",
    description: "Find your 1-rep max Back Squat.\nWork up to a heavy single with proper warm-up sets.",
    scoreType: "Load",
  },
  {
    title: "Max Front Squat",
    description: "Find your 1-rep max Front Squat.",
    scoreType: "Load",
  },
  {
    title: "Max Deadlift",
    description: "Find your 1-rep max Deadlift.",
    scoreType: "Load",
  },
  {
    title: "Max Clean & Jerk",
    description: "Find your 1-rep max Clean & Jerk.",
    scoreType: "Load",
  },
  {
    title: "Max Snatch",
    description: "Find your 1-rep max Snatch.",
    scoreType: "Load",
  },
  {
    title: "Max Overhead Press",
    description: "Find your 1-rep max Strict Overhead Press (no leg drive).",
    scoreType: "Load",
  },
  {
    title: "Max Push Press",
    description: "Find your 1-rep max Push Press.",
    scoreType: "Load",
  },
  {
    title: "Max Clean",
    description: "Find your 1-rep max Power Clean or Squat Clean.",
    scoreType: "Load",
  },
  {
    title: "Max Bench Press",
    description: "Find your 1-rep max Bench Press.",
    scoreType: "Load",
  },
  {
    title: "Max Thruster",
    description: "Find your 1-rep max Thruster.",
    scoreType: "Load",
  },
];

// ─── Classic MetCons ─────────────────────────────────────────────────────────
const METCONS: TemplateInput[] = [
  {
    title: "Fight Gone Bad",
    description:
      "3 rounds (1 minute at each station, 1 minute rest between rounds):\nWall Balls (20/14 lb)\nSumo Deadlift High Pull (75/55 lb)\nBox Jumps (20 in)\nPush Press (75/55 lb)\nRow (calories)\n\nScore = total reps + calories.",
    scoreType: "Reps",
  },
  {
    title: "Tabata Something Else",
    description:
      "Tabata (8 rounds of 20 sec on / 10 sec off) for each:\nPull-ups\nPush-ups\nSit-ups\nSquats\n\nScore = total reps across all 32 intervals.",
    scoreType: "Reps",
  },
  {
    title: "Annie",
    description:
      "50-40-30-20-10 reps for time:\nDouble-Unders\nSit-ups",
    scoreType: "Time",
  },
  {
    title: "Lynne",
    description:
      "5 rounds, not for time:\nMax rep Bench Press (bodyweight)\nMax rep Pull-ups\n\nRest as needed between sets. Score = total reps.",
    scoreType: "Reps",
  },
  {
    title: "Eva",
    description:
      "5 rounds for time:\n800m Run\n30 Kettlebell Swings (70/53 lb)\n30 Pull-ups",
    scoreType: "Time",
  },
  {
    title: "Nicole",
    description:
      "20-minute AMRAP:\n400m Run\nMax rep Pull-ups\n\nRecord the number of pull-ups completed for each round and note total.",
    scoreType: "Reps",
  },
  {
    title: "Amanda",
    description:
      "9-7-5 reps for time:\nMuscle-ups\nSnatches (135/95 lb)",
    scoreType: "Time",
  },
  {
    title: "Nasty Girls",
    description:
      "3 rounds for time:\n50 Air Squats\n7 Muscle-ups\n10 Hang Power Cleans (135/95 lb)",
    scoreType: "Time",
  },
];

// ─── All templates ────────────────────────────────────────────────────────────
const ALL_TEMPLATES: TemplateInput[] = [
  ...GIRL_WODS,
  ...HERO_WODS,
  ...STRENGTH_TESTS,
  ...METCONS,
];

async function main() {
  const userId =
    process.env.WORKOUT_USER_ID ||
    (await prisma.user.findFirst({ select: { id: true } }).then((u) => u?.id));

  if (!userId) {
    console.error(
      "No user found in the database. Create an account first, or set WORKOUT_USER_ID."
    );
    process.exit(1);
  }

  console.log(`Targeting user: ${userId}`);

  if (!process.env.SKIP_CLEAR) {
    const deleted = await prisma.workoutTemplate.deleteMany({
      where: { userId },
    });
    console.log(`Deleted ${deleted.count} existing template(s).`);
  }

  const created = await prisma.workoutTemplate.createMany({
    data: ALL_TEMPLATES.map((t) => ({
      userId,
      title: t.title,
      description: t.description,
      scoreType: t.scoreType,
    })),
    skipDuplicates: true,
  });

  console.log(`Created ${created.count} curated workout template(s).`);
  console.log("Done!");
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
