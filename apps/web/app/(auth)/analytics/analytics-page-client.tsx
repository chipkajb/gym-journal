"use client";

import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { subMonths, subYears } from "date-fns";
import {
  formatWorkoutCalendarDate,
  formatWorkoutCalendarMonthDay,
} from "@/lib/calendar-date";
import {
  Lightbulb,
  Trophy,
  Dumbbell,
  Calendar,
  TrendingUp,
  List,
  Search,
  ChevronDown,
} from "lucide-react";
import { FrequencyChart } from "./frequency-chart";
import { HealthMetricsCharts } from "./health-metrics-charts";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

/** Linear regression: returns trend y-values for each x index, or null if < 2 points. */
function computeTrend(values: number[]): number[] | null {
  const n = values.length;
  if (n < 2) return null;
  const sumX = (n * (n - 1)) / 2;
  const sumY = values.reduce((a, v) => a + v, 0);
  const sumXY = values.reduce((a, v, i) => a + i * v, 0);
  const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  return values.map((_, i) => slope * i + intercept);
}

type AnalyticsDotPayload = { isPr?: boolean };

function AnalyticsPrDot(props: {
  cx?: number;
  cy?: number;
  payload?: AnalyticsDotPayload;
}) {
  const { cx = 0, cy = 0, payload } = props;
  if (payload?.isPr) {
    return (
      <circle
        cx={cx}
        cy={cy}
        r={5}
        fill="rgb(245, 158, 11)"
        stroke="white"
        strokeWidth={2}
      />
    );
  }
  return <circle cx={cx} cy={cy} r={3} fill="rgb(59, 130, 246)" />;
}

type PrEntry = {
  id: string;
  title: string;
  workoutDate: string;
  bestResultDisplay: string | null;
  scoreType: string | null;
  rxOrScaled: string | null;
};

type ProgressEntry = {
  id: string;
  title: string;
  workoutDate: string;
  bestResultRaw: number | null;
  bestResultDisplay: string | null;
  scoreType: string | null;
  rxOrScaled: string | null;
  isPr: boolean;
};

type Summary = { totalSessions: number; prCount: number; recentCount: number };

type TimeRangeKey = "all" | "1y" | "6m" | "3m" | "1m";

const TIME_RANGES: { value: TimeRangeKey; label: string }[] = [
  { value: "all", label: "All time" },
  { value: "1y", label: "1 year" },
  { value: "6m", label: "6 months" },
  { value: "3m", label: "3 months" },
  { value: "1m", label: "1 month" },
];

function cutoffDate(key: TimeRangeKey): Date | null {
  const now = new Date();
  switch (key) {
    case "all":
      return null;
    case "1y":
      return subYears(now, 1);
    case "6m":
      return subMonths(now, 6);
    case "3m":
      return subMonths(now, 3);
    case "1m":
      return subMonths(now, 1);
    default:
      return null;
  }
}

type Props = {
  initialPrs: PrEntry[];
  workoutTitles: string[];
  /** Initial chart selection: workout with the most sessions (tie-break A–Z). */
  defaultProgressTitle: string;
  summary: Summary;
  preferredUnit?: string;
  /** When set from the stats hub, omit duplicate summary cards and health charts (those live on other tabs). */
  layout?: "full" | "hub-workouts";
};

function WorkoutCombobox({
  titles,
  value,
  onChange,
}: {
  titles: string[];
  value: string;
  onChange: (title: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = query.trim()
    ? titles.filter((t) => t.toLowerCase().includes(query.toLowerCase()))
    : titles;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function select(title: string) {
    onChange(title);
    setOpen(false);
    setQuery("");
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm max-w-[260px] min-w-[160px]"
      >
        <span className="truncate flex-1 text-left">
          {value || "Select a workout"}
        </span>
        <ChevronDown className="w-4 h-4 shrink-0 text-gray-400" />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search workouts…"
                className="w-full pl-7 pr-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
          <ul className="max-h-64 overflow-y-auto">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                No matches
              </li>
            ) : (
              filtered.map((t) => (
                <li key={t}>
                  <button
                    type="button"
                    onClick={() => select(t)}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      t === value
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium"
                        : "text-gray-900 dark:text-white"
                    }`}
                  >
                    {t}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export function AnalyticsPageClient({
  initialPrs,
  workoutTitles,
  defaultProgressTitle,
  summary,
  preferredUnit = "metric",
  layout = "full",
}: Props) {
  const [workoutFilter, setWorkoutFilter] = useState<string>("");
  const [timeRange, setTimeRange] = useState<TimeRangeKey>("all");
  const [workoutResults, setWorkoutResults] = useState<ProgressEntry[] | null>(
    null
  );
  const [loadingResults, setLoadingResults] = useState(false);

  const [prSearch, setPrSearch] = useState("");
  const [prPage, setPrPage] = useState(1);
  const PR_PAGE_SIZE = 12;

  const fetchResultsForWorkout = useCallback(async (title: string) => {
    if (!title.trim()) {
      setWorkoutResults(null);
      return;
    }
    setLoadingResults(true);
    try {
      const res = await fetch(
        `/api/analytics/progress?title=${encodeURIComponent(title)}`
      );
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setWorkoutResults(
        data.map(
          (s: {
            id: string;
            title: string;
            workoutDate: string;
            bestResultRaw: number | null;
            bestResultDisplay: string | null;
            scoreType: string | null;
            rxOrScaled: string | null;
            isPr: boolean;
          }) => ({
            id: s.id,
            title: s.title,
            workoutDate: s.workoutDate,
            bestResultRaw: s.bestResultRaw,
            bestResultDisplay: s.bestResultDisplay,
            scoreType: s.scoreType,
            rxOrScaled: s.rxOrScaled,
            isPr: s.isPr,
          })
        )
      );
    } catch {
      setWorkoutResults(null);
    } finally {
      setLoadingResults(false);
    }
  }, []);

  useEffect(() => {
    if (workoutTitles.length > 0 && !workoutFilter) {
      const pick =
        defaultProgressTitle && workoutTitles.includes(defaultProgressTitle)
          ? defaultProgressTitle
          : workoutTitles[0];
      setWorkoutFilter(pick);
    }
  }, [workoutTitles, workoutFilter, defaultProgressTitle]);

  useEffect(() => {
    if (workoutFilter) {
      fetchResultsForWorkout(workoutFilter);
    } else {
      setWorkoutResults(null);
    }
  }, [workoutFilter, fetchResultsForWorkout]);

  const cutoff = useMemo(() => cutoffDate(timeRange), [timeRange]);

  const filteredResults = useMemo(() => {
    if (!workoutResults) return [];
    if (!cutoff) return workoutResults;
    return workoutResults.filter(
      (p) => new Date(p.workoutDate).getTime() >= cutoff.getTime()
    );
  }, [workoutResults, cutoff]);

  const hideRxColumn = useMemo(
    () =>
      filteredResults.length > 0 &&
      filteredResults.every((s) => s.scoreType === "Load"),
    [filteredResults]
  );

  const chartData = useMemo(() => {
    const base = filteredResults
      .filter((p) => p.bestResultRaw != null)
      .map((p) => ({
        date: formatWorkoutCalendarMonthDay(p.workoutDate),
        fullDate: p.workoutDate,
        result: p.bestResultRaw as number,
        display: p.bestResultDisplay ?? String(p.bestResultRaw),
        isPr: p.isPr,
      }));

    const trendValues = computeTrend(base.map((d) => d.result));
    return base.map((d, i) => ({
      ...d,
      trend: trendValues ? trendValues[i] : undefined,
    }));
  }, [filteredResults]);

  const displayTitle = workoutFilter || "Select a workout";

  const filteredPrs = useMemo(() => {
    if (!prSearch.trim()) return initialPrs;
    const q = prSearch.toLowerCase();
    return initialPrs.filter((pr) => pr.title.toLowerCase().includes(q));
  }, [initialPrs, prSearch]);

  const paginatedPrs = useMemo(
    () => filteredPrs.slice(0, prPage * PR_PAGE_SIZE),
    [filteredPrs, prPage, PR_PAGE_SIZE]
  );

  const hasMorePrs = paginatedPrs.length < filteredPrs.length;

  function focusWorkout(title: string) {
    setWorkoutFilter(title);
  }

  const isHubWorkouts = layout === "hub-workouts";
  const HeadingTag = isHubWorkouts ? "h2" : "h1";
  const headingClass = isHubWorkouts
    ? "text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2"
    : "text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2";

  return (
    <div className="space-y-8">
      <div>
        <HeadingTag className={headingClass}>
          {!isHubWorkouts && <Lightbulb className="w-7 h-7 shrink-0" />}
          {isHubWorkouts ? <TrendingUp className="w-6 h-6 shrink-0 text-blue-500" /> : null}
          {isHubWorkouts ? "Workouts & PRs" : "Training insights"}
        </HeadingTag>
        {isHubWorkouts ? (
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Progress by workout, full PR library, and training frequency. Totals and streaks live on the Overview
            tab; smartwatch charts on Health trends.
          </p>
        ) : (
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Personal records, progress over time, workout trends, and smartwatch metrics.
          </p>
        )}
      </div>

      {!isHubWorkouts && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
              <Dumbbell className="w-4 h-4" />
              <span className="text-sm font-medium">Total workouts</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {summary.totalSessions}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
              <Trophy className="w-4 h-4" />
              <span className="text-sm font-medium">Personal records</span>
            </div>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {summary.prCount}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-medium">Last 30 days</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {summary.recentCount}
            </p>
          </div>
        </div>
      )}

      {!isHubWorkouts && <HealthMetricsCharts />}

      {workoutTitles.length > 0 && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Progress over time
            </h2>
            <WorkoutCombobox
              titles={workoutTitles}
              value={workoutFilter}
              onChange={setWorkoutFilter}
            />
            <select
              value={timeRange}
              onChange={(e) =>
                setTimeRange(e.target.value as TimeRangeKey)
              }
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              {TIME_RANGES.map((tr) => (
                <option key={tr.value} value={tr.value}>
                  {tr.label}
                </option>
              ))}
            </select>
          </div>
          {loadingResults ? (
            <p className="text-gray-500 dark:text-gray-400 py-8 text-center">
              Loading results…
            </p>
          ) : chartData.length > 0 ? (
            <>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-gray-200 dark:stroke-gray-600"
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      className="text-gray-500 dark:text-gray-400"
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      className="text-gray-500 dark:text-gray-400"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--tooltip-bg, #fff)",
                        color: "var(--tooltip-color, #111827)",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                      }}
                      formatter={(
                        value: number,
                        name: string,
                        props: { payload?: { display?: string; isPr?: boolean } }
                      ) => {
                        if (name === "Trend") return [null, null];
                        const label = props.payload?.isPr
                          ? `${props.payload.display ?? String(value)} ★ PR`
                          : (props.payload?.display ?? String(value));
                        return [label, "Result"];
                      }}
                      labelFormatter={(_, payload) =>
                        payload?.[0]?.payload?.fullDate
                          ? formatWorkoutCalendarDate(
                              payload[0].payload.fullDate as string,
                              "long"
                            )
                          : ""
                      }
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="result"
                      name={displayTitle}
                      stroke="rgb(59, 130, 246)"
                      strokeWidth={2}
                      dot={<AnalyticsPrDot />}
                    />
                    <Line
                      type="linear"
                      dataKey="trend"
                      name="Trend"
                      stroke="rgba(156,163,175,0.8)"
                      strokeWidth={1.5}
                      strokeDasharray="5 5"
                      dot={false}
                      activeDot={false}
                      legendType="line"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-3 flex-wrap">
                <span className="inline-flex items-center gap-1">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400 border-2 border-white ring-1 ring-amber-400" />
                  PR
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="inline-block w-5 border-t-2 border-dashed border-gray-400" />
                  Trend
                </span>
                Lower is better for time; higher is better for reps/load.
              </p>
            </>
          ) : workoutResults && workoutResults.length > 0 ? (
              <p className="text-gray-500 dark:text-gray-400 py-4">
                No numeric results in this time range for the chart. See table
                below.
              </p>
            ) : workoutResults && workoutResults.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 py-4">
                No results yet for this workout.
              </p>
            ) : null}
        </div>
      )}

      {workoutFilter && (workoutResults?.length ?? 0) > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <List className="w-5 h-5" />
            All results for &quot;{displayTitle}&quot;
            {timeRange !== "all" && (
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                ({TIME_RANGES.find((r) => r.value === timeRange)?.label})
              </span>
            )}
          </h2>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-100 dark:bg-gray-700/80 text-left">
                  <tr>
                    <th className="px-4 py-2 font-medium text-gray-700 dark:text-gray-300">
                      Date
                    </th>
                    <th className="px-4 py-2 font-medium text-gray-700 dark:text-gray-300">
                      Result
                    </th>
                    {!hideRxColumn && (
                      <th className="px-4 py-2 font-medium text-gray-700 dark:text-gray-300">
                        RX/Scaled
                      </th>
                    )}
                    <th className="px-4 py-2 font-medium text-gray-700 dark:text-gray-300 w-20">
                      Link
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[...filteredResults]
                    .reverse()
                    .map((s) => (
                      <tr
                        key={s.id}
                        className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <td className="px-4 py-2 text-gray-900 dark:text-white whitespace-nowrap">
                          {formatWorkoutCalendarDate(s.workoutDate, "short")}
                        </td>
                        <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                          <span className="inline-flex items-center gap-1.5">
                            {s.isPr && (
                              <span className="text-amber-500" title="Personal record">
                                ★
                              </span>
                            )}
                            <span>
                              {s.bestResultDisplay ??
                                (s.bestResultRaw != null ? String(s.bestResultRaw) : "—")}
                            </span>
                          </span>
                        </td>
                        {!hideRxColumn && (
                          <td className="px-4 py-2 text-gray-600 dark:text-gray-400">
                            {s.rxOrScaled ?? "—"}
                          </td>
                        )}
                        <td className="px-4 py-2">
                          <Link
                            href={`/workouts/${s.id}`}
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <p className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
              {filteredResults.length} result{filteredResults.length !== 1 ? "s" : ""}
              {timeRange !== "all" &&
                workoutResults &&
                ` (of ${workoutResults.length} all time)`}
            </p>
          </div>
        </div>
      )}

      {/* Advanced analytics: workout frequency */}
      <FrequencyChart />

      <div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            Personal records
          </h2>
          {initialPrs.length > 0 && (
            <div className="relative sm:ml-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search PRs…"
                value={prSearch}
                onChange={(e) => {
                  setPrSearch(e.target.value);
                  setPrPage(1);
                }}
                className="pl-9 pr-4 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-56"
              />
            </div>
          )}
        </div>

        {initialPrs.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">
            No PRs yet. Log workouts to see your personal records here.
          </p>
        ) : filteredPrs.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 py-4">
            No PRs match &quot;{prSearch}&quot;.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {paginatedPrs.map((pr) => (
                <div
                  key={pr.id}
                  className="flex flex-col p-4 rounded-xl bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-900/50 hover:border-amber-400 dark:hover:border-amber-600 transition-colors shadow-sm"
                >
                  {/* Score type badge */}
                  <div className="flex items-center justify-between mb-2">
                    {pr.scoreType ? (
                      <span className="text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">
                        {pr.scoreType}
                      </span>
                    ) : (
                      <span />
                    )}
                    {pr.rxOrScaled && (
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          pr.rxOrScaled === "RX"
                            ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                            : "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
                        }`}
                      >
                        {pr.rxOrScaled}
                      </span>
                    )}
                  </div>

                  {/* Workout name */}
                  <p className="font-semibold text-gray-900 dark:text-white leading-tight mb-1 line-clamp-2">
                    {pr.title}
                  </p>

                  {/* Result */}
                  {pr.bestResultDisplay && (
                    <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mb-1">
                      {pr.bestResultDisplay}
                    </p>
                  )}

                  {/* Date */}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    {formatWorkoutCalendarDate(pr.workoutDate, "short")}
                  </p>

                  {/* Actions */}
                  <div className="flex gap-2 mt-auto pt-2 border-t border-gray-100 dark:border-gray-700">
                    <Link
                      href={`/workouts/${pr.id}`}
                      className="flex-1 text-center px-2 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    >
                      View session
                    </Link>
                    <button
                      type="button"
                      onClick={() => focusWorkout(pr.title)}
                      className="flex-1 text-center px-2 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      All results
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Showing {paginatedPrs.length} of {filteredPrs.length} PR
                {filteredPrs.length !== 1 ? "s" : ""}
                {prSearch && initialPrs.length !== filteredPrs.length
                  ? ` (filtered from ${initialPrs.length})`
                  : ""}
              </p>
              {hasMorePrs && (
                <button
                  type="button"
                  onClick={() => setPrPage((p) => p + 1)}
                  className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  Show more
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
