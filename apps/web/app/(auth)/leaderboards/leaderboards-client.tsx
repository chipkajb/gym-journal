"use client";

import Link from "next/link";
import { Trophy, Flame, Zap, Target, TrendingUp, Calendar, Medal, Star, BarChart2, Heart, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type Stats = {
  currentStreak: number;
  longestStreak: number;
  totalWorkouts: number;
  thisMonthCount: number;
  thisYearCount: number;
  prCount: number;
  rxRate: number;
  uniqueWorkouts: number;
  bestMonthLabel: string;
  bestMonthCount: number;
  // Health
  totalCalories: number;
  maxCaloriesInSession: number | null;
  allTimeMaxHR: number | null;
  avgHROverall: number | null;
  totalMinutes: number | null;
};

type MonthlyData = { month: string; total: number; rx: number }[];
type DayData = { day: string; count: number }[];
type PR = {
  id: string;
  title: string;
  workoutDate: string;
  bestResultDisplay: string | null;
  rxOrScaled: string | null;
  scoreType: string | null;
};

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function LeaderboardsClient({
  stats,
  monthlyData,
  dayOfWeekData,
  recentPrs,
}: {
  stats: Stats;
  monthlyData: MonthlyData;
  dayOfWeekData: DayData;
  recentPrs: PR[];
}) {
  const topStats = [
    {
      label: "Current Streak",
      value: `${stats.currentStreak}`,
      unit: "days",
      icon: Flame,
      color: "text-orange-500",
      bg: "bg-orange-50 dark:bg-orange-950/30",
      note: stats.currentStreak > 0 ? "Keep it going! 🔥" : "Start your streak today",
    },
    {
      label: "Longest Streak",
      value: `${stats.longestStreak}`,
      unit: "days",
      icon: Star,
      color: "text-amber-500",
      bg: "bg-amber-50 dark:bg-amber-950/30",
      note: "Personal best",
    },
    {
      label: "Total PRs",
      value: `${stats.prCount}`,
      unit: "records",
      icon: Trophy,
      color: "text-emerald-500",
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
      note: "All time",
    },
    {
      label: "RX Rate",
      value: `${stats.rxRate}`,
      unit: "%",
      icon: Target,
      color: "text-blue-500",
      bg: "bg-blue-50 dark:bg-blue-950/30",
      note: "Workouts at RX",
    },
    {
      label: "This Month",
      value: `${stats.thisMonthCount}`,
      unit: "workouts",
      icon: Calendar,
      color: "text-violet-500",
      bg: "bg-violet-50 dark:bg-violet-950/30",
      note: "Current month",
    },
    {
      label: "This Year",
      value: `${stats.thisYearCount}`,
      unit: "workouts",
      icon: TrendingUp,
      color: "text-sky-500",
      bg: "bg-sky-50 dark:bg-sky-950/30",
      note: `${Math.round(stats.thisYearCount / (new Date().getMonth() + 1))} avg/month`,
    },
    {
      label: "Total Workouts",
      value: `${stats.totalWorkouts}`,
      unit: "sessions",
      icon: Zap,
      color: "text-indigo-500",
      bg: "bg-indigo-50 dark:bg-indigo-950/30",
      note: "All time",
    },
    {
      label: "Unique WODs",
      value: `${stats.uniqueWorkouts}`,
      unit: "workouts",
      icon: Medal,
      color: "text-rose-500",
      bg: "bg-rose-50 dark:bg-rose-950/30",
      note: "Different workouts done",
    },
  ];

  const hasHealthStats = stats.totalCalories > 0 || stats.allTimeMaxHR != null || stats.avgHROverall != null || stats.totalMinutes != null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Leaderboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Your personal achievements and statistics</p>
      </div>

      {/* Best Month Highlight */}
      {stats.bestMonthCount > 0 && (
        <div className="p-5 rounded-xl bg-gradient-to-r from-primary/20 to-primary/5 border border-primary/20">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/20 rounded-xl">
              <Trophy className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Best Month Ever</p>
              <p className="text-xl font-bold text-foreground">{stats.bestMonthLabel}</p>
              <p className="text-sm text-muted-foreground">{stats.bestMonthCount} workouts in one month</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {topStats.map(({ label, value, unit, icon: Icon, color, bg, note }) => (
          <div key={label} className="p-4 rounded-xl bg-card border border-border">
            <div className={`inline-flex p-2 rounded-lg ${bg} mb-3`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-foreground">
              {value}
              <span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span>
            </p>
            <p className="text-xs font-medium text-foreground mt-0.5">{label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{note}</p>
          </div>
        ))}
      </div>

      {/* Health & Performance Stats */}
      {hasHealthStats && (
        <div className="p-5 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold text-foreground">Health & Performance</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.totalCalories > 0 && (
              <div>
                <p className="text-xs text-muted-foreground">Total Calories Burned</p>
                <p className="text-xl font-bold text-orange-500">{stats.totalCalories.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">kcal all time</p>
              </div>
            )}
            {stats.maxCaloriesInSession != null && (
              <div>
                <p className="text-xs text-muted-foreground">Best Single Session</p>
                <p className="text-xl font-bold text-orange-400">{stats.maxCaloriesInSession}</p>
                <p className="text-xs text-muted-foreground">kcal in one workout</p>
              </div>
            )}
            {stats.allTimeMaxHR != null && (
              <div>
                <p className="text-xs text-muted-foreground">Peak Heart Rate</p>
                <p className="text-xl font-bold text-red-500">{stats.allTimeMaxHR}</p>
                <p className="text-xs text-muted-foreground">bpm all time</p>
              </div>
            )}
            {stats.avgHROverall != null && (
              <div>
                <p className="text-xs text-muted-foreground">Avg Heart Rate</p>
                <p className="text-xl font-bold text-pink-500">{stats.avgHROverall}</p>
                <p className="text-xs text-muted-foreground">bpm across workouts</p>
              </div>
            )}
            {stats.totalMinutes != null && stats.totalMinutes > 0 && (
              <div>
                <p className="text-xs text-muted-foreground">Total Time Training</p>
                <p className="text-xl font-bold text-blue-500">{formatMinutes(stats.totalMinutes)}</p>
                <p className="text-xs text-muted-foreground">from logged session totals</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Monthly Volume Chart */}
      <div className="p-5 rounded-xl bg-card border border-border">
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-semibold text-foreground">Monthly Volume (Last 12 Months)</h2>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
            />
            <Bar dataKey="total" name="Total" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
            <Bar dataKey="rx" name="RX" fill="#10b981" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2 justify-end">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-primary" />
            <span className="text-xs text-muted-foreground">Total</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-emerald-500" />
            <span className="text-xs text-muted-foreground">RX</span>
          </div>
        </div>
      </div>

      {/* Day of Week Chart */}
      <div className="p-5 rounded-xl bg-card border border-border">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-semibold text-foreground">Favorite Days to Train</h2>
        </div>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={dayOfWeekData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
            />
            <Bar dataKey="count" name="Workouts" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent PRs */}
      {recentPrs.length > 0 && (
        <div className="p-5 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-muted-foreground" />
              <h2 className="font-semibold text-foreground">Recent Personal Records</h2>
            </div>
            <Link href="/analytics" className="text-xs text-primary hover:text-primary/80 font-medium">
              View all →
            </Link>
          </div>
          <ul className="space-y-2">
            {recentPrs.map((pr) => (
              <li key={pr.id}>
                <Link
                  href={`/workouts/${pr.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg shrink-0">
                    <Trophy className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{pr.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(pr.workoutDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      {pr.rxOrScaled && ` · ${pr.rxOrScaled}`}
                    </p>
                  </div>
                  {pr.bestResultDisplay && (
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                      {pr.bestResultDisplay}
                    </span>
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
