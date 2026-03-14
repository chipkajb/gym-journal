"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
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
import { Scale } from "lucide-react";

type CompositionPoint = {
  date: string;
  label: string;
  weight: number | null;
  bodyFatPct: number | null;
  muscleMass: number | null;
  bmi: number | null;
};

type RangeKey = "1m" | "3m" | "6m" | "1y" | "all";

const RANGES: { value: RangeKey; label: string }[] = [
  { value: "3m", label: "3 months" },
  { value: "6m", label: "6 months" },
  { value: "1y", label: "1 year" },
  { value: "all", label: "All time" },
];

export function BodyCompositionChart({ unit = "metric" }: { unit?: string }) {
  const [range, setRange] = useState<RangeKey>("6m");
  const [data, setData] = useState<CompositionPoint[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (r: RangeKey) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics/body-composition?range=${r}`);
      if (!res.ok) return;
      const json = await res.json();
      setData(json.data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(range); }, [range, load]);

  const weightUnit = unit === "imperial" ? "lbs" : "kg";

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Scale className="w-5 h-5" />
          Body composition trends
        </h2>
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
      ) : data.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 py-8 text-center text-sm">
          No body metrics in this range. Add metrics on the{" "}
          <Link href="/metrics" className="text-blue-600 dark:text-blue-400 underline">
            Metrics
          </Link>{" "}
          page.
        </p>
      ) : (
        <>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-600" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11 }}
                  className="text-gray-500 dark:text-gray-400"
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 11 }} className="text-gray-500 dark:text-gray-400" />
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--tooltip-bg, #fff)", border: "1px solid #e5e7eb", borderRadius: "8px" }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="weight"
                  name={`Weight (${weightUnit})`}
                  stroke="rgb(59,130,246)"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="bodyFatPct"
                  name="Body fat %"
                  stroke="rgb(249,115,22)"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="muscleMass"
                  name={`Muscle mass (${weightUnit})`}
                  stroke="rgb(34,197,94)"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Multiple metrics displayed on a shared Y-axis. Use as directional trends.
          </p>
        </>
      )}
    </div>
  );
}
