import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ChevronLeft } from "lucide-react";
import { EditWorkoutForm } from "@/components/features/workouts/edit-workout-form";

export default async function EditWorkoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const { id } = await params;
  const workoutSession = await prisma.workoutSession.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!workoutSession) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/workouts/${id}`}
          className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Back to workout"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Edit workout
        </h1>
      </div>

      <EditWorkoutForm
        sessionId={workoutSession.id}
        initial={{
          title: workoutSession.title,
          description: workoutSession.description ?? "",
          workoutDate: workoutSession.workoutDate.toISOString().slice(0, 10),
          bestResultDisplay: workoutSession.bestResultDisplay ?? "",
          bestResultRaw: workoutSession.bestResultRaw?.toString() ?? "",
          scoreType: workoutSession.scoreType ?? "",
          barbellLift: workoutSession.barbellLift ?? "",
          notes: workoutSession.notes ?? "",
          rxOrScaled: workoutSession.rxOrScaled ?? "",
          isPr: workoutSession.isPr,
        }}
      />
    </div>
  );
}
