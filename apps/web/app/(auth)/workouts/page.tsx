import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Plus, Dumbbell } from "lucide-react";
import { format } from "date-fns";

export default async function WorkoutsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const sessions = await prisma.workoutSession.findMany({
    where: { userId: session.user.id },
    orderBy: { workoutDate: "desc" },
    take: 50,
    include: { workoutTemplate: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Workouts
        </h1>
        <Link
          href="/workouts/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Log workout
        </Link>
      </div>

      {sessions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-12 text-center">
          <Dumbbell className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            No workouts yet. Log your first session or import from CSV.
          </p>
          <Link
            href="/workouts/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Log workout
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {sessions.map((s) => (
            <li key={s.id}>
              <Link
                href={`/workouts/${s.id}`}
                className="block p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {s.title}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {format(new Date(s.workoutDate), "MMM d, yyyy")}
                      {s.bestResultDisplay && (
                        <> · {s.bestResultDisplay}</>
                      )}
                      {s.rxOrScaled && <> · {s.rxOrScaled}</>}
                    </p>
                  </div>
                  {s.isPr && (
                    <span className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded">
                      PR
                    </span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
