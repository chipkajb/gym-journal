import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  BookOpen,
  PenLine,
  BarChart3,
  Dumbbell,
  Shuffle,
  Trophy,
  Flame,
  Target,
  Zap,
  TrendingUp,
  Timer,
  type LucideIcon,
} from "lucide-react";
import { DashboardGreeting } from "./dashboard-greeting";

// Calculate current streak from sorted dates (descending)
function calcStreak(dates: Date[]): number {
  if (dates.length === 0) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const sorted = [...dates].sort((a, b) => b.getTime() - a.getTime());
  const uniqueDays = [...new Set(sorted.map(d => {
    const day = new Date(d);
    day.setHours(0, 0, 0, 0);
    return day.toISOString();
  }))].map(s => new Date(s)).sort((a, b) => b.getTime() - a.getTime());

  // Check if first date is today or yesterday
  if (uniqueDays[0].getTime() !== today.getTime() && uniqueDays[0].getTime() !== yesterday.getTime()) {
    return 0;
  }

  let streak = 1;
  for (let i = 1; i < uniqueDays.length; i++) {
    const diff = (uniqueDays[i-1].getTime() - uniqueDays[i].getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const [recentSessions, templateCount, allDates, prCount, weekCount] = await Promise.all([
    prisma.workoutSession.findMany({
      where: { userId: session.user.id },
      orderBy: { workoutDate: "desc" },
      take: 5,
    }),
    prisma.workoutTemplate.count({ where: { userId: session.user.id } }),
    prisma.workoutSession.findMany({
      where: { userId: session.user.id },
      select: { workoutDate: true },
      orderBy: { workoutDate: "desc" },
    }),
    prisma.workoutSession.count({ where: { userId: session.user.id, isPr: true } }),
    prisma.workoutSession.count({
      where: {
        userId: session.user.id,
        workoutDate: { gte: startOfWeek },
      },
    }),
  ]);

  const firstName = session.user.name?.trim()
    ? session.user.name.trim().split(/\s+/)[0]
    : session.user.email?.split("@")[0] ?? "there";

  const currentStreak = calcStreak(allDates.map(r => r.workoutDate));
  const totalWorkouts = allDates.length;

  const stats = [
    { label: "Day Streak", value: currentStreak, icon: Flame, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-950/30" },
    { label: "This Week", value: weekCount, icon: Zap, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30" },
    { label: "Total PRs", value: prCount, icon: Target, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
    { label: "All Time", value: totalWorkouts, icon: TrendingUp, color: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-950/30" },
  ];

  type QuickAction = {
    href: string;
    label: string;
    desc: string;
    icon: LucideIcon;
    accent: string;
    bg: string;
    border: string;
  };

  const quickActionGroups: { title: string; actions: QuickAction[] }[] = [
    {
      title: "Training",
      actions: [
        {
          href: "/wod",
          label: "WOD Picker",
          desc: "Random workout from your library",
          icon: Shuffle,
          accent: "text-orange-600 dark:text-orange-400",
          bg: "bg-orange-50 dark:bg-orange-950/30",
          border: "hover:border-orange-400 dark:hover:border-orange-500",
        },
        {
          href: "/workouts",
          label: "Workouts",
          desc: "Sessions list & history",
          icon: PenLine,
          accent: "text-teal-600 dark:text-teal-400",
          bg: "bg-teal-50 dark:bg-teal-950/30",
          border: "hover:border-teal-400 dark:hover:border-teal-500",
        },
        {
          href: "/library",
          label: "Library",
          desc: `${templateCount} template${templateCount !== 1 ? "s" : ""}`,
          icon: BookOpen,
          accent: "text-blue-600 dark:text-blue-400",
          bg: "bg-blue-50 dark:bg-blue-950/30",
          border: "hover:border-blue-400 dark:hover:border-blue-500",
        },
      ],
    },
    {
      title: "Stats",
      actions: [
        {
          href: "/analytics",
          label: "Insights",
          desc: "PRs, progress, smartwatch metrics",
          icon: BarChart3,
          accent: "text-violet-600 dark:text-violet-400",
          bg: "bg-violet-50 dark:bg-violet-950/30",
          border: "hover:border-violet-400 dark:hover:border-violet-500",
        },
        {
          href: "/leaderboards",
          label: "Leaderboard",
          desc: "Achievements & health stats",
          icon: Trophy,
          accent: "text-amber-600 dark:text-amber-400",
          bg: "bg-amber-50 dark:bg-amber-950/30",
          border: "hover:border-amber-400 dark:hover:border-amber-500",
        },
      ],
    },
    {
      title: "Tools",
      actions: [
        {
          href: "/timer",
          label: "Timer",
          desc: "Standalone workout timer",
          icon: Timer,
          accent: "text-lime-600 dark:text-lime-400",
          bg: "bg-lime-50 dark:bg-lime-950/30",
          border: "hover:border-lime-400 dark:hover:border-lime-500",
        },
        {
          href: "/tools/1rm",
          label: "1RM estimate",
          desc: "Strength calculator",
          icon: Dumbbell,
          accent: "text-rose-600 dark:text-rose-400",
          bg: "bg-rose-50 dark:bg-rose-950/30",
          border: "hover:border-rose-400 dark:hover:border-rose-500",
        },
      ],
    },
  ];

  return (
    <div className="space-y-8">
      <DashboardGreeting firstName={firstName} streak={currentStreak} />

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${bg}`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions — same groups, order, and destinations as the header toolbar */}
      <div className="space-y-6">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Quick Actions
        </h2>
        {quickActionGroups.map(({ title, actions }) => (
          <div key={title}>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              {title}
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {actions.map(({ href, label, desc, icon: Icon, accent, bg, border }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 p-4 rounded-xl bg-card border border-border ${border} transition-all hover:shadow-sm`}
                >
                  <div className={`p-2.5 rounded-lg ${bg} shrink-0`}>
                    <Icon className={`w-5 h-5 ${accent}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground text-sm">{label}</p>
                    <p className="text-xs text-muted-foreground truncate">{desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
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
                      {new Date(s.workoutDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
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
