import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create sample exercises
  const exercises = await Promise.all([
    prisma.exercise.create({
      data: {
        name: "Barbell Squat",
        description: "Compound lower body exercise targeting quads, glutes, and hamstrings",
        category: "Strength",
        muscleGroup: "Legs",
        equipment: "Barbell",
        instructions: "Stand with feet shoulder-width apart, barbell on upper back. Lower hips back and down, keeping chest up. Drive through heels to return to standing.",
      },
    }),
    prisma.exercise.create({
      data: {
        name: "Bench Press",
        description: "Compound upper body exercise targeting chest, shoulders, and triceps",
        category: "Strength",
        muscleGroup: "Chest",
        equipment: "Barbell",
        instructions: "Lie on bench, grip barbell slightly wider than shoulders. Lower bar to mid-chest, then press back up.",
      },
    }),
    prisma.exercise.create({
      data: {
        name: "Running",
        description: "Cardiovascular exercise for endurance and fitness",
        category: "Cardio",
        muscleGroup: "Full Body",
        equipment: "None",
        instructions: "Maintain steady pace, focus on breathing and form.",
      },
    }),
    prisma.exercise.create({
      data: {
        name: "Pull-ups",
        description: "Bodyweight exercise targeting back and biceps",
        category: "Strength",
        muscleGroup: "Back",
        equipment: "Pull-up Bar",
        instructions: "Hang from bar with palms facing away. Pull body up until chin clears bar, lower with control.",
      },
    }),
  ]);

  console.log(`✅ Created ${exercises.length} sample exercises`);
  console.log("✨ Seeding complete!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
