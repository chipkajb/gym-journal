import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Dumbbell, Flame, Plus, Shuffle, Target, Timer, TrendingUp, Zap } from "lucide-react";
import { DashboardGreeting } from "./dashboard-greeting";
import { computeWorkoutStreaks } from "@/lib/workout-streak";
import { formatWorkoutCalendarDate } from "@/lib/calendar-date";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const [recentSessions, recentDates, totalWorkouts, prCount, weekCount] = await Promise.all([
    prisma.workoutSession.findMany({
      where: { userId: session.user.id },
      orderBy: { workoutDate: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        workoutDate: true,
        bestResultDisplay: true,
        rxOrScaled: true,
        isPr: true,
      },
    }),
    // ponytail: only the current streak is shown, so the last 400 workouts bound it
    prisma.workoutSession.findMany({
      where: { userId: session.user.id },
      select: { workoutDate: true },
      orderBy: { workoutDate: "desc" },
      take: 400,
    }),
    prisma.workoutSession.count({ where: { userId: session.user.id } }),
    prisma.workoutSession.count({ where: { userId: session.user.id, isPr: true } }),
    prisma.workoutSession.count({
      where: { userId: session.user.id, workoutDate: { gte: startOfWeek } },
    }),
  ]);

  const firstName = session.user.name?.trim()
    ? session.user.name.trim().split(/\s+/)[0]
    : session.user.email?.split("@")[0] ?? "there";

  const currentStreak = computeWorkoutStreaks(recentDates.map((r) => r.workoutDate)).current;

  const stats = [
    { label: "Day Streak", value: currentStreak, icon: Flame, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-950/30" },
    { label: "This Week", value: weekCount, icon: Zap, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30" },
    { label: "Total PRs", value: prCount, icon: Target, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
    { label: "All Time", value: totalWorkouts, icon: TrendingUp, color: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-950/30" },
  ];

  return (
    <div className="space-y-6">
      <DashboardGreeting
        firstName={firstName}
        streak={currentStreak}
        dayIndex={Math.floor(now.getTime() / 86_400_000)}
      />

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${bg}`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold tabular text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Primary actions */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Link
          href="/workouts/new"
          className="sm:col-span-1 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md active:scale-[0.98]"
        >
          <Plus className="w-5 h-5" />
          Log workout
        </Link>
        <Link
          href="/training?tab=wod"
          className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3.5 font-medium transition-all hover:border-primary/40 hover:shadow-sm active:scale-[0.98]"
        >
          <Shuffle className="w-5 h-5 text-muted-foreground" />
          Pick a WOD
        </Link>
        <Link
          href="/tools"
          className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3.5 font-medium transition-all hover:border-primary/40 hover:shadow-sm active:scale-[0.98]"
        >
          <Timer className="w-5 h-5 text-muted-foreground" />
          Start timer
        </Link>
      </div>

      {/* Recent Workouts */}
      {recentSessions.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Recent Workouts
            </h2>
            <Link href="/history" className="text-xs text-primary hover:text-primary/80 font-medium">
              View all →
            </Link>
          </div>
          <ul className="space-y-2">
            {recentSessions.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/workouts/${s.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/40 transition-all hover:shadow-sm"
                >
                  <div className="p-2 rounded-lg bg-muted shrink-0">
                    <Dumbbell className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate text-sm">{s.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatWorkoutCalendarDate(s.workoutDate, "short")}
                      {s.bestResultDisplay && ` · ${s.bestResultDisplay}`}
                      {s.rxOrScaled && ` · ${s.rxOrScaled}`}
                    </p>
                  </div>
                  {s.isPr && (
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full shrink-0">PR</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
