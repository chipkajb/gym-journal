import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BookOpen, PenLine, Calendar, Dumbbell } from "lucide-react";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const [recentSessions, templateCount] = await Promise.all([
    prisma.workoutSession.findMany({
      where: { userId: session.user.id },
      orderBy: { startedAt: "desc" },
      take: 5,
      include: { exerciseLogs: true },
    }),
    prisma.workoutTemplate.count({ where: { userId: session.user.id } }),
  ]);

  const firstName = session.user.name?.trim()
    ? session.user.name.trim().split(/\s+/)[0]
    : session.user.email?.split("@")[0] ?? "there";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome back, {firstName}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Track your workouts and progress
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/library"
          className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
        >
          <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Workout Library
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {templateCount} template{templateCount !== 1 ? "s" : ""}
            </p>
          </div>
        </Link>
        <Link
          href="/workouts"
          className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
        >
          <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
            <PenLine className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Log Workout
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Start a new session
            </p>
          </div>
        </Link>
        <Link
          href="/history"
          className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
        >
          <div className="p-3 rounded-lg bg-amber-100 dark:bg-amber-900/30">
            <Calendar className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">
              History
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Calendar view
            </p>
          </div>
        </Link>
      </div>

      {recentSessions.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Recent workouts
          </h2>
          <ul className="space-y-2">
            {recentSessions.map((s) => (
              <li
                key={s.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
              >
                <Dumbbell className="w-5 h-5 text-gray-400" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">
                    {s.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(s.startedAt).toLocaleDateString()} ·{" "}
                    {s.exerciseLogs.length} exercise{s.exerciseLogs.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
