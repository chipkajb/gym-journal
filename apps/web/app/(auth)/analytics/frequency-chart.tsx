"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Activity, Trophy } from "lucide-react";

type FrequencyPoint = {
  period: string;
  label: string;
  total: number;
  rx: number;
  scaled: number;
  pr: number;
};

type GroupBy = "week" | "month";
type RangeKey = "1m" | "3m" | "6m" | "1y" | "all";
type Tab = "workouts" | "prs";

const RANGES: { value: RangeKey; label: string }[] = [
  { value: "1m", label: "1 month" },
  { value: "3m", label: "3 months" },
  { value: "6m", label: "6 months" },
  { value: "1y", label: "1 year" },
  { value: "all", label: "All time" },
];

export function FrequencyChart() {
  const [tab, setTab] = useState<Tab>("workouts");
  const [groupBy, setGroupBy] = useState<GroupBy>("week");
  const [range, setRange] = useState<RangeKey>("3m");
  const [data, setData] = useState<FrequencyPoint[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (gb: GroupBy, r: RangeKey) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics/frequency?groupBy=${gb}&range=${r}`);
      if (!res.ok) return;
      const json = await res.json();
      setData(json.data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(groupBy, range); }, [groupBy, range, load]);

  const isEmpty =
    data.length === 0 ||
    (tab === "workouts"
      ? data.every((d) => d.total === 0)
      : data.every((d) => d.pr === 0));

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setTab("workouts")}
          className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tab === "workouts"
              ? "border-blue-500 text-blue-600 dark:text-blue-400"
              : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          <Activity className="w-4 h-4" />
          Workout frequency
        </button>
        <button
          onClick={() => setTab("prs")}
          className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tab === "prs"
              ? "border-amber-500 text-amber-600 dark:text-amber-400"
              : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          <Trophy className="w-4 h-4" />
          PR frequency
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select
          value={groupBy}
          onChange={(e) => setGroupBy(e.target.value as GroupBy)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
        >
          <option value="week">By week</option>
          <option value="month">By month</option>
        </select>
        <select
          value={range}
          onChange={(e) => setRange(e.target.value as RangeKey)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
        >
          {RANGES.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-gray-500 dark:text-gray-400 py-8 text-center text-sm">Loading…</p>
      ) : isEmpty ? (
        <p className="text-gray-500 dark:text-gray-400 py-8 text-center text-sm">
          {tab === "workouts"
            ? "No workout data in this range. Start logging to see your frequency trends."
            : "No PRs recorded in this range. Keep pushing to set new personal records."}
        </p>
      ) : tab === "workouts" ? (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-600" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11 }}
                className="text-gray-500 dark:text-gray-400"
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} className="text-gray-500 dark:text-gray-400" />
              <Tooltip
                contentStyle={{ backgroundColor: "var(--tooltip-bg, #fff)", color: "var(--tooltip-color, #111827)", border: "1px solid #e5e7eb", borderRadius: "8px" }}
                cursor={{ fill: "rgba(99,102,241,0.08)" }}
              />
              <Legend />
              <Bar dataKey="rx" name="RX" stackId="a" fill="rgb(59,130,246)" />
              <Bar dataKey="scaled" name="Scaled" stackId="a" fill="rgb(147,197,253)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-600" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11 }}
                className="text-gray-500 dark:text-gray-400"
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} className="text-gray-500 dark:text-gray-400" />
              <Tooltip
                contentStyle={{ backgroundColor: "var(--tooltip-bg, #fff)", color: "var(--tooltip-color, #111827)", border: "1px solid #e5e7eb", borderRadius: "8px" }}
                cursor={{ fill: "rgba(251,191,36,0.08)" }}
              />
              <Legend />
              <Bar dataKey="pr" name="PRs" fill="rgb(245,158,11)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
