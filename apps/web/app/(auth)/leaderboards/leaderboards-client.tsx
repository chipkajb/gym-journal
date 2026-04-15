"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  differenceInCalendarDays,
  format,
  subDays,
  subYears,
  startOfDay,
  endOfDay,
} from "date-fns";
import {
  type LucideIcon,
  Trophy,
  Flame,
  Zap,
  Calendar,
  Star,
  BarChart2,
  Heart,
  Percent,
  Activity,
  SlidersHorizontal,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type Stats = {
  currentStreak: number;
  longestStreak: number;
  totalWorkouts: number;
  /** Share of RX among sessions with RX or Scaled logged (null if none). */
  rxPercentage: number | null;
};

type BestMonthByYearMap = Record<number, { month: number; count: number }>;

type HealthSessionRow = {
  workoutDate: string;
  calories: number | null;
  maxHeartRate: number | null;
  avgHeartRate: number | null;
  totalDurationSeconds: number | null;
};

type HealthPreset = "7d" | "30d" | "1y" | "all" | "custom";

type SnapshotRangePreset = "7d" | "30d" | "90d" | "1y" | "all";

function snapshotRange(preset: SnapshotRangePreset): { from: Date; to: Date } {
  const to = endOfDay(new Date());
  switch (preset) {
    case "7d":
      return { from: startOfDay(subDays(to, 6)), to };
    case "30d":
      return { from: startOfDay(subDays(to, 29)), to };
    case "90d":
      return { from: startOfDay(subDays(to, 89)), to };
    case "1y":
      return { from: startOfDay(subYears(to, 1)), to };
    case "all":
      return { from: startOfDay(subYears(to, 100)), to };
  }
}

function healthPresetRange(
  preset: HealthPreset,
  customFrom: string,
  customTo: string
): { from: Date; to: Date } {
  const to = startOfDay(new Date());
  if (preset === "custom" && customFrom && customTo) {
    return { from: startOfDay(new Date(customFrom)), to: startOfDay(new Date(customTo)) };
  }
  switch (preset) {
    case "7d":
      return { from: startOfDay(subDays(to, 6)), to };
    case "30d":
      return { from: startOfDay(subDays(to, 29)), to };
    case "1y":
      return { from: startOfDay(subYears(to, 1)), to };
    case "all":
      return { from: startOfDay(subYears(to, 25)), to };
    default:
      return { from: startOfDay(subDays(to, 29)), to };
  }
}

function aggregateHealthStats(sessions: HealthSessionRow[]) {
  const withCalories = sessions.filter(s => s.calories != null && s.calories > 0);
  const totalCalories = withCalories.reduce((sum, s) => sum + (s.calories ?? 0), 0);
  const avgCaloriesPerSession =
    withCalories.length > 0 ? Math.round(totalCalories / withCalories.length) : null;
  const maxCaloriesInSession =
    withCalories.length > 0 ? Math.max(...withCalories.map(s => s.calories ?? 0)) : null;
  const withMaxHR = sessions.filter(s => s.maxHeartRate != null && s.maxHeartRate > 0);
  const allTimeMaxHR =
    withMaxHR.length > 0 ? Math.max(...withMaxHR.map(s => s.maxHeartRate ?? 0)) : null;
  const avgPeakHrPerSession =
    withMaxHR.length > 0
      ? Math.round(withMaxHR.reduce((sum, s) => sum + (s.maxHeartRate ?? 0), 0) / withMaxHR.length)
      : null;
  const withAvgHR = sessions.filter(s => s.avgHeartRate != null);
  const avgHROverall =
    withAvgHR.length > 0
      ? Math.round(withAvgHR.reduce((sum, s) => sum + (s.avgHeartRate ?? 0), 0) / withAvgHR.length)
      : null;
  const withTotalDuration = sessions.filter(s => s.totalDurationSeconds != null && s.totalDurationSeconds > 0);
  const totalMinutes =
    withTotalDuration.length > 0
      ? Math.round(withTotalDuration.reduce((sum, s) => sum + (s.totalDurationSeconds ?? 0), 0) / 60)
      : null;
  const avgMinutesPerSession =
    withTotalDuration.length > 0
      ? Math.round(
          withTotalDuration.reduce((sum, s) => sum + (s.totalDurationSeconds ?? 0), 0) /
            withTotalDuration.length /
            60
        )
      : null;

  return {
    totalCalories,
    avgCaloriesPerSession,
    maxCaloriesInSession,
    allTimeMaxHR: allTimeMaxHR != null && allTimeMaxHR > 0 ? allTimeMaxHR : null,
    avgPeakHrPerSession,
    avgHROverall,
    totalMinutes: totalMinutes != null && totalMinutes > 0 ? totalMinutes : null,
    avgMinutesPerSession,
  };
}

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

function formatRollingPerWeek(n: number): string {
  const rounded = Math.round(n * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(1);
}

function isRxOrScaledChoice(s: { scoreType: string; rxOrScaled: string | null }): boolean {
  if (s.scoreType === "Load") return false;
  const v = s.rxOrScaled;
  return v === "RX" || v === "SCALED" || v === "Scaled";
}

const SNAPSHOT_RANGE_KEYS = [
  ["7d", "7d"],
  ["30d", "30d"],
  ["90d", "90d"],
  ["1y", "1y"],
  ["all", "All time"],
] as const satisfies readonly (readonly [SnapshotRangePreset, string])[];

function PeriodRangeControl({
  value,
  onChange,
  controlsId,
}: {
  value: SnapshotRangePreset;
  onChange: (next: SnapshotRangePreset) => void;
  controlsId: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Period"
      aria-controls={controlsId}
      className="grid w-full grid-cols-5 gap-0.5 rounded-xl border border-border bg-muted/40 p-1 shadow-inner"
    >
      {SNAPSHOT_RANGE_KEYS.map(([key, label]) => {
        const selected = value === key;
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(key)}
            className={`min-h-[2.25rem] w-full rounded-lg px-1 py-2 text-center text-[10px] font-semibold tabular-nums transition-colors sm:min-h-[2.5rem] sm:px-1.5 sm:text-xs ${
              selected
                ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                : "text-muted-foreground hover:bg-background/60 hover:text-foreground"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

type SessionSnapshotRow = {
  workoutDate: string;
  title: string;
  scoreType: string;
  rxOrScaled: string | null;
  isPr: boolean;
};

export function LeaderboardsClient({
  stats,
  healthSessions,
  monthlyData,
  dayOfWeekData,
  recentPrs,
  sessionSnapshots,
  bestMonthByYear,
  availableYears,
  pageTitle = "Leaderboard",
  pageDescription = "Your personal achievements and statistics",
  recentPrsMoreHref = "/analytics?view=workouts",
  headingLevel = "page",
}: {
  stats: Stats;
  healthSessions: HealthSessionRow[];
  monthlyData: MonthlyData;
  dayOfWeekData: DayData;
  recentPrs: PR[];
  sessionSnapshots: SessionSnapshotRow[];
  bestMonthByYear: BestMonthByYearMap;
  availableYears: number[];
  pageTitle?: string;
  pageDescription?: string;
  /** "View all" link for the recent PRs teaser */
  recentPrsMoreHref?: string;
  /** Use "section" when nested under another page title (e.g. stats hub). */
  headingLevel?: "page" | "section";
}) {
  const [healthPreset, setHealthPreset] = useState<HealthPreset>("30d");
  const [snapshotRangePreset, setSnapshotRangePreset] = useState<SnapshotRangePreset>("30d");
  const [bestMonthYear, setBestMonthYear] = useState<number>(() => {
    const y = new Date().getFullYear();
    return availableYears.includes(y) ? y : availableYears[0] ?? y;
  });
  const [customFrom, setCustomFrom] = useState(() =>
    format(startOfDay(subDays(new Date(), 29)), "yyyy-MM-dd")
  );
  const [customTo, setCustomTo] = useState(() => format(startOfDay(new Date()), "yyyy-MM-dd"));

  const { from, to } = useMemo(
    () => healthPresetRange(healthPreset, customFrom, customTo),
    [healthPreset, customFrom, customTo]
  );

  const filteredHealthSessions = useMemo(() => {
    const end = endOfDay(to);
    return healthSessions.filter(s => {
      const d = new Date(s.workoutDate);
      return d >= from && d <= end;
    });
  }, [healthSessions, from, to]);

  const healthStats = useMemo(
    () => aggregateHealthStats(filteredHealthSessions),
    [filteredHealthSessions]
  );

  const inSnapshotRangeRows = useMemo(() => {
    const { from, to } = snapshotRange(snapshotRangePreset);
    return sessionSnapshots.filter(s => {
      const d = new Date(s.workoutDate);
      return d >= from && d <= to;
    });
  }, [sessionSnapshots, snapshotRangePreset]);

  const snapshotRangeDaySpan = useMemo(() => {
    const { from, to } = snapshotRange(snapshotRangePreset);
    return Math.max(1, differenceInCalendarDays(to, from) + 1);
  }, [snapshotRangePreset]);

  const { prsInWindow, sessionsInWindow, sessionsPerWeekInWindow, rxPctInWindow } = useMemo(() => {
    const prs = inSnapshotRangeRows.filter(s => s.isPr).length;
    const sessions = inSnapshotRangeRows.length;
    const weeksInRange = snapshotRangeDaySpan / 7;
    const sessionsPerWeekInWindow = sessions / weeksInRange;
    let rx = 0;
    let rxDenom = 0;
    for (const s of inSnapshotRangeRows) {
      if (!isRxOrScaledChoice(s)) continue;
      rxDenom++;
      if (s.rxOrScaled === "RX") rx++;
    }
    const rxPct = rxDenom > 0 ? Math.round((100 * rx) / rxDenom) : null;
    return {
      prsInWindow: prs,
      sessionsInWindow: sessions,
      sessionsPerWeekInWindow,
      rxPctInWindow: rxPct,
    };
  }, [inSnapshotRangeRows, snapshotRangeDaySpan]);

  const hasAnyHealthEver = useMemo(
    () =>
      healthSessions.some(
        s =>
          (s.calories != null && s.calories > 0) ||
          s.maxHeartRate != null ||
          s.avgHeartRate != null ||
          (s.totalDurationSeconds != null && s.totalDurationSeconds > 0)
      ),
    [healthSessions]
  );
  const headStats: {
    label: string;
    value: string;
    unit: string;
    icon: LucideIcon;
    color: string;
    bg: string;
    note: string;
  }[] = [
    {
      label: "Current streak",
      value: `${stats.currentStreak}`,
      unit: "days",
      icon: Flame,
      color: "text-orange-500",
      bg: "bg-orange-50 dark:bg-orange-950/30",
      note: stats.currentStreak > 0 ? "Keep it going! 🔥" : "Start today",
    },
    {
      label: "Longest streak",
      value: `${stats.longestStreak}`,
      unit: "days",
      icon: Star,
      color: "text-amber-500",
      bg: "bg-amber-50 dark:bg-amber-950/30",
      note: "Personal best",
    },
  ];

  const bestForSelectedYear = bestMonthByYear[bestMonthYear];
  const bestMonthName =
    bestForSelectedYear && bestForSelectedYear.count > 0
      ? new Date(bestMonthYear, bestForSelectedYear.month - 1, 1).toLocaleDateString("en-US", {
          month: "long",
        })
      : null;

  const hasHealthStats =
    healthStats.totalCalories > 0 ||
    healthStats.allTimeMaxHR != null ||
    healthStats.avgHROverall != null ||
    healthStats.totalMinutes != null;

  const HeadingTag = headingLevel === "section" ? "h2" : "h1";
  const headingClass =
    headingLevel === "section"
      ? "text-xl font-bold text-foreground"
      : "text-2xl font-bold text-foreground";

  return (
    <div className="space-y-8">
      <div>
        <HeadingTag className={headingClass}>{pageTitle}</HeadingTag>
        {pageDescription ? (
          <p className="text-muted-foreground text-sm mt-1">{pageDescription}</p>
        ) : null}
      </div>

      {availableYears.length > 0 && (
        <div className="p-5 rounded-xl bg-gradient-to-r from-primary/20 to-primary/5 border border-primary/20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3 min-w-0">
              <div className="p-3 bg-primary/20 rounded-xl shrink-0">
                <Trophy className="w-6 h-6 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground font-medium">Best month</p>
                {bestMonthName && bestForSelectedYear ? (
                  <>
                    <p className="text-xl font-bold text-foreground">{bestMonthName}</p>
                    <p className="text-sm text-muted-foreground">
                      {bestForSelectedYear.count} workout{bestForSelectedYear.count === 1 ? "" : "s"}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground mt-0.5">No workouts logged this year</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 sm:pl-2">
              <label htmlFor="best-month-year" className="sr-only">
                Year
              </label>
              <select
                id="best-month-year"
                value={bestMonthYear}
                onChange={e => setBestMonthYear(Number(e.target.value))}
                className="h-9 min-w-[5.5rem] rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {availableYears.map(y => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          {headStats.map(({ label, value, unit, icon: Icon, color, bg, note }) => (
            <div key={label} className="p-4 rounded-xl bg-card border border-border">
              <div className={`inline-flex p-2 rounded-lg ${bg} mb-3`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <p className="text-2xl font-bold text-foreground">
                {value}
                {unit ? <span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span> : null}
              </p>
              <p className="text-xs font-medium text-foreground mt-0.5">{label}</p>
              {note ? <p className="text-xs text-muted-foreground mt-0.5">{note}</p> : null}
            </div>
          ))}
        </div>

        <section
          className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden ring-1 ring-border/60"
          aria-labelledby="period-snapshot-heading"
        >
          <div className="flex flex-col gap-3 px-4 py-3.5 border-b border-border bg-muted/30">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background shadow-sm"
                aria-hidden
              >
                <SlidersHorizontal className="h-4 w-4 text-muted-foreground" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <h3 id="period-snapshot-heading" className="text-sm font-semibold text-foreground tracking-tight">
                  Period snapshot
                </h3>
              </div>
            </div>
            <PeriodRangeControl
              value={snapshotRangePreset}
              onChange={setSnapshotRangePreset}
              controlsId="period-snapshot-metrics"
            />
          </div>
          <div
            id="period-snapshot-metrics"
            className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border p-px"
            role="group"
            aria-labelledby="period-snapshot-heading"
          >
            <div className="bg-card p-4">
              <div className="inline-flex p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 mb-3 w-fit">
                <Zap className="w-4 h-4 text-indigo-500" />
              </div>
              <p className="text-2xl font-bold text-foreground tabular-nums">
                {sessionsInWindow}
                <span className="text-sm font-normal text-muted-foreground ml-1">sessions</span>
              </p>
              <p className="text-xs font-medium text-foreground mt-0.5">Workouts</p>
              <p className="text-xs text-muted-foreground mt-0.5">All-time · {stats.totalWorkouts}</p>
            </div>
            <div className="bg-card p-4">
              <div className="inline-flex p-2 rounded-lg bg-cyan-50 dark:bg-cyan-950/30 mb-3 w-fit">
                <Activity className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              </div>
              <p className="text-2xl font-bold text-foreground tabular-nums">
                {formatRollingPerWeek(sessionsPerWeekInWindow)}
                <span className="text-sm font-normal text-muted-foreground ml-1">/ wk</span>
              </p>
              <p className="text-xs font-medium text-foreground mt-0.5">Sessions / week</p>
            </div>
            <div className="bg-card p-4">
              <div className="inline-flex p-2 rounded-lg bg-teal-50 dark:bg-teal-950/30 mb-3 w-fit">
                <Percent className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              </div>
              <p className="text-2xl font-bold text-foreground">
                {rxPctInWindow != null ? rxPctInWindow : "—"}
                {rxPctInWindow != null ? (
                  <span className="text-sm font-normal text-muted-foreground ml-1">%</span>
                ) : null}
              </p>
              <p className="text-xs font-medium text-foreground mt-0.5">RX rate</p>
              {stats.rxPercentage != null ? (
                <p className="text-xs text-muted-foreground mt-0.5">All-time · {stats.rxPercentage}%</p>
              ) : null}
            </div>
            <div className="bg-card p-4">
              <div className="inline-flex p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 mb-3 w-fit">
                <Trophy className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-bold text-foreground tabular-nums">
                {prsInWindow}
                <span className="text-sm font-normal text-muted-foreground ml-1">PRs</span>
              </p>
              <p className="text-xs font-medium text-foreground mt-0.5">PRs in period</p>
            </div>
          </div>
        </section>
      </div>

      {/* Health & Performance Stats (time window) */}
      {hasAnyHealthEver && (
        <div className="p-5 rounded-xl bg-card border border-border space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-muted-foreground" />
              <h2 className="font-semibold text-foreground">Health</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  ["7d", "Last 7 days"],
                  ["30d", "Last month"],
                  ["1y", "Last year"],
                  ["all", "All"],
                  ["custom", "Custom"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setHealthPreset(key)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    healthPreset === key
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {healthPreset === "custom" && (
            <div className="flex flex-wrap items-end gap-3 text-sm">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">From</label>
                <input
                  type="date"
                  value={customFrom}
                  onChange={e => setCustomFrom(e.target.value)}
                  className="px-2 py-1 border border-border rounded-lg bg-background text-foreground"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">To</label>
                <input
                  type="date"
                  value={customTo}
                  onChange={e => setCustomTo(e.target.value)}
                  className="px-2 py-1 border border-border rounded-lg bg-background text-foreground"
                />
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            {healthPreset === "all"
              ? "All sessions with health data."
              : `${format(from, "MMM d, yyyy")} – ${format(to, "MMM d, yyyy")}`}
          </p>

          {hasHealthStats ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Calories</p>
                {healthStats.totalCalories > 0 ? (
                  <>
                    <p className="text-xl font-bold text-orange-500">{healthStats.totalCalories.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">kcal</p>
                    {healthStats.avgCaloriesPerSession != null && (
                      <p className="text-xs text-muted-foreground mt-1">
                        ~{healthStats.avgCaloriesPerSession.toLocaleString()} kcal / session
                      </p>
                    )}
                    {healthStats.maxCaloriesInSession != null && healthStats.maxCaloriesInSession > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Best session {healthStats.maxCaloriesInSession} kcal
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">—</p>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Training time</p>
                {healthStats.totalMinutes != null && healthStats.totalMinutes > 0 ? (
                  <>
                    <p className="text-xl font-bold text-blue-500">{formatMinutes(healthStats.totalMinutes)}</p>
                    {healthStats.avgMinutesPerSession != null && healthStats.avgMinutesPerSession > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        ~{formatMinutes(healthStats.avgMinutesPerSession)} / session
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">—</p>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg HR</p>
                {healthStats.avgHROverall != null ? (
                  <>
                    <p className="text-xl font-bold text-pink-500">{healthStats.avgHROverall}</p>
                    <p className="text-xs text-muted-foreground">bpm</p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">—</p>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Max HR</p>
                {healthStats.allTimeMaxHR != null ? (
                  <>
                    <p className="text-xl font-bold text-red-500">{healthStats.allTimeMaxHR}</p>
                    <p className="text-xs text-muted-foreground">bpm</p>
                    {healthStats.avgPeakHrPerSession != null && (
                      <p className="text-xs text-muted-foreground mt-1">
                        ~{healthStats.avgPeakHrPerSession} bpm avg peak
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">—</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nothing in this range. Widen the window or log calories, HR, or duration on workouts.
            </p>
          )}
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
            <Bar dataKey="total" name="RX or Scaled" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
            <Bar dataKey="rx" name="RX" fill="#10b981" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2 justify-end">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-primary" />
            <span className="text-xs text-muted-foreground">RX or Scaled</span>
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
            <Link href={recentPrsMoreHref} className="text-xs text-primary hover:text-primary/80 font-medium">
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
