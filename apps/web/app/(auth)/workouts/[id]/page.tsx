import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ChevronLeft } from "lucide-react";
import { SessionTimer } from "@/components/features/workouts/session-timer";
import { ExerciseLogList } from "@/components/features/workouts/exercise-log-list";
import { AddExerciseLogForm } from "@/components/features/workouts/add-exercise-log-form";

export default async function WorkoutSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const { id } = await params;
  const workoutSession = await prisma.workoutSession.findFirst({
    where: { id, userId: session.user.id },
    include: {
      exerciseLogs: {
        include: { exercise: true },
        orderBy: { orderIndex: "asc" },
      },
    },
  });

  if (!workoutSession) notFound();

  const exercises = await prisma.exercise.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {workoutSession.name}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {workoutSession.category}
            {!workoutSession.completedAt && " · In progress"}
          </p>
        </div>
      </div>

      {!workoutSession.completedAt && (
        <SessionTimer startedAt={workoutSession.startedAt.toISOString()} />
      )}

      <ExerciseLogList
        sessionId={workoutSession.id}
        logs={workoutSession.exerciseLogs}
        isCompleted={!!workoutSession.completedAt}
      />

      {!workoutSession.completedAt && (
        <AddExerciseLogForm
          sessionId={workoutSession.id}
          exercises={exercises}
          nextOrderIndex={workoutSession.exerciseLogs.length}
        />
      )}
    </div>
  );
}
