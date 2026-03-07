import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ChevronLeft } from "lucide-react";
import { format } from "date-fns";
import { WorkoutSessionActions } from "@/components/features/workouts/workout-session-actions";

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
    include: { workoutTemplate: true },
  });

  if (!workoutSession) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
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
              {workoutSession.title}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {format(new Date(workoutSession.workoutDate), "MMMM d, yyyy")}
              {workoutSession.rxOrScaled && ` · ${workoutSession.rxOrScaled}`}
              {workoutSession.isPr && " · PR"}
            </p>
          </div>
        </div>
        <WorkoutSessionActions sessionId={workoutSession.id} />
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 space-y-4">
        {workoutSession.bestResultDisplay && (
          <div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Result
            </span>
            <p className="text-xl font-semibold text-gray-900 dark:text-white">
              {workoutSession.bestResultDisplay}
            </p>
          </div>
        )}
        {workoutSession.scoreType && (
          <div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Score type
            </span>
            <p className="text-gray-900 dark:text-white">
              {workoutSession.scoreType}
            </p>
          </div>
        )}
        {workoutSession.description && (
          <div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Description
            </span>
            <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
              {workoutSession.description}
            </p>
          </div>
        )}
        {workoutSession.barbellLift && (
          <div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Barbell lift
            </span>
            <p className="text-gray-900 dark:text-white">
              {workoutSession.barbellLift}
            </p>
          </div>
        )}
        {workoutSession.notes && (
          <div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Notes
            </span>
            <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
              {workoutSession.notes}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
