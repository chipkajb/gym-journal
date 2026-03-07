import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ChevronLeft } from "lucide-react";
import { StartWorkoutForm } from "@/components/features/workouts/start-workout-form";

const CATEGORIES = ["Strength", "Cardio", "CrossFit", "Flexibility"];

export default async function NewWorkoutPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const templates = await prisma.workoutTemplate.findMany({
    where: { userId: session.user.id },
    include: {
      exercises: { include: { exercise: true }, orderBy: { orderIndex: "asc" } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/workouts"
          className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Back to workouts"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Start workout
        </h1>
      </div>

      <StartWorkoutForm
        categories={CATEGORIES}
        templates={templates.map((t) => ({
          id: t.id,
          name: t.name,
          category: t.category,
          exerciseCount: t.exercises.length,
        }))}
      />
    </div>
  );
}
