"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { format, parseISO, subMonths, subYears } from "date-fns";
import {
  BarChart3,
  Trophy,
  Dumbbell,
  Calendar,
  TrendingUp,
  List,
} from "lucide-react";
import { FrequencyChart } from "./frequency-chart";
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
  summary: Summary;
  preferredUnit?: string;
};

export function AnalyticsPageClient({
  initialPrs,
  workoutTitles,
  summary,
  preferredUnit = "metric",
}: Props) {
  const [workoutFilter, setWorkoutFilter] = useState<string>("");
  const [timeRange, setTimeRange] = useState<TimeRangeKey>("all");
  const [workoutResults, setWorkoutResults] = useState<ProgressEntry[] | null>(
    null
  );
  const [loadingResults, setLoadingResults] = useState(false);

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
      setWorkoutFilter(workoutTitles[0]);
    }
  }, [workoutTitles, workoutFilter]);

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

  const chartData = useMemo(() => {
    return filteredResults
      .filter((p) => p.bestResultRaw != null)
      .map((p) => ({
        date: format(parseISO(p.workoutDate), "MMM d"),
        fullDate: p.workoutDate,
        result: p.bestResultRaw,
        display: p.bestResultDisplay ?? String(p.bestResultRaw),
        isPr: p.isPr,
      }));
  }, [filteredResults]);

  const displayTitle = workoutFilter || "Select a workout";

  function focusWorkout(title: string) {
    setWorkoutFilter(title);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <BarChart3 className="w-7 h-7" />
          Progress & analytics
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Personal records, progress over time, and workout trends.
        </p>
      </div>

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

      {workoutTitles.length > 0 && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Progress over time
            </h2>
            <select
              value={workoutFilter}
              onChange={(e) => setWorkoutFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="">Select a workout</option>
              {workoutTitles.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
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
                        _name: string,
                        props: { payload?: { display?: string } }
                      ) =>
                        [
                          props.payload?.display ?? String(value),
                          "Result",
                        ]
                      }
                      labelFormatter={(_, payload) =>
                        payload?.[0]?.payload?.fullDate
                          ? format(
                              parseISO(payload[0].payload.fullDate),
                              "PPP"
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
                      dot={(props) => {
                        const { cx, cy, payload } = props;
                        return payload.isPr ? (
                          <circle
                            cx={cx}
                            cy={cy}
                            r={5}
                            fill="rgb(245, 158, 11)"
                            stroke="white"
                            strokeWidth={2}
                          />
                        ) : (
                          <circle
                            cx={cx}
                            cy={cy}
                            r={3}
                            fill="rgb(59, 130, 246)"
                          />
                        );
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Gold dots = PR. Lower is better for time; higher is better for
                reps/load.
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
                    <th className="px-4 py-2 font-medium text-gray-700 dark:text-gray-300">
                      RX/Scaled
                    </th>
                    <th className="px-4 py-2 font-medium text-gray-700 dark:text-gray-300">
                      PR
                    </th>
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
                          {format(parseISO(s.workoutDate), "MMM d, yyyy")}
                        </td>
                        <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                          {s.bestResultDisplay ?? (s.bestResultRaw != null ? String(s.bestResultRaw) : "—")}
                        </td>
                        <td className="px-4 py-2 text-gray-600 dark:text-gray-400">
                          {s.rxOrScaled ?? "—"}
                        </td>
                        <td className="px-4 py-2">
                          {s.isPr ? (
                            <span className="text-amber-600 dark:text-amber-400 font-medium">
                              PR
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
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
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          Personal records
        </h2>
        {initialPrs.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">
            No PRs yet. Log workouts to see your personal records here.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {initialPrs.map((pr) => (
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
                  {format(parseISO(pr.workoutDate), "MMM d, yyyy")}
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
        )}
      </div>
    </div>
  );
}
