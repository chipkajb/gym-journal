"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format, subDays, subYears, startOfDay } from "date-fns";
import { Heart, Flame, Clock, Activity } from "lucide-react";
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

type SeriesRow = {
  day: string;
  avgHeartRateAvg: number | null;
  maxHeartRateMax: number | null;
  caloriesSum: number;
  trainingMinutesSum: number;
  sessionCount: number;
};

type Preset = "7d" | "30d" | "1y" | "all" | "custom";

function presetRange(preset: Preset, customFrom: string, customTo: string): { from: Date; to: Date } {
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
      return { from: startOfDay(subYears(to, 10)), to };
    default:
      return { from: startOfDay(subDays(to, 29)), to };
  }
}

export function HealthMetricsCharts() {
  const [preset, setPreset] = useState<Preset>("30d");
  const [customFrom, setCustomFrom] = useState(
    () => format(startOfDay(subDays(new Date(), 29)), "yyyy-MM-dd")
  );
  const [customTo, setCustomTo] = useState(() => format(startOfDay(new Date()), "yyyy-MM-dd"));
  const [series, setSeries] = useState<SeriesRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { from, to } = useMemo(
    () => presetRange(preset, customFrom, customTo),
    [preset, customFrom, customTo]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const qs = new URLSearchParams({
        from: format(from, "yyyy-MM-dd"),
        to: format(to, "yyyy-MM-dd"),
      });
      const res = await fetch(`/api/analytics/health-timeseries?${qs}`);
      if (!res.ok) throw new Error("Failed");
      const data = (await res.json()) as { series: SeriesRow[] };
      setSeries(data.series ?? []);
    } catch {
      setSeries(null);
      setError("Could not load smartwatch metrics.");
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  const chartData = useMemo(
    () =>
      (series ?? []).map((r) => ({
        label: format(new Date(r.day + "T12:00:00"), "MMM d"),
        ...r,
        caloriesSum: r.caloriesSum || null,
        trainingMinutesSum: Math.round(r.trainingMinutesSum * 10) / 10 || null,
        maxHeartRateMax: r.maxHeartRateMax,
        avgHeartRateAvg: r.avgHeartRateAvg,
      })),
    [series]
  );

  const hasAny = chartData.some(
    (d) =>
      (d.caloriesSum != null && d.caloriesSum > 0) ||
      d.maxHeartRateMax != null ||
      d.avgHeartRateAvg != null ||
      (d.trainingMinutesSum != null && d.trainingMinutesSum > 0)
  );

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-rose-500" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Smartwatch metrics over time
          </h2>
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
              onClick={() => setPreset(key)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                preset === key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {preset === "custom" && (
        <div className="flex flex-wrap items-end gap-3 text-sm">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">From</label>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">To</label>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <button
            type="button"
            onClick={() => void load()}
            className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium"
          >
            Apply
          </button>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      {loading && <p className="text-sm text-gray-500 dark:text-gray-400">Loading…</p>}
      {!loading && !hasAny && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Log workouts with health data (calories, heart rate, or total time training) to see charts
          here.
        </p>
      )}

      {!loading && hasAny && (
        <div className="space-y-8">
          <MetricBlock
            title="Calories (sum per day)"
            icon={Flame}
            color="#f97316"
            dataKey="caloriesSum"
            chartData={chartData}
            unit=" kcal"
          />
          <MetricBlock
            title="Total time training (sum per day)"
            icon={Clock}
            color="#3b82f6"
            dataKey="trainingMinutesSum"
            chartData={chartData}
            unit=" min"
          />
          <MetricBlock
            title="Average heart rate (daily mean of your logged averages)"
            icon={Heart}
            color="#ec4899"
            dataKey="avgHeartRateAvg"
            chartData={chartData}
            unit=" bpm"
          />
          <MetricBlock
            title="Max heart rate (peak per day)"
            icon={Heart}
            color="#ef4444"
            dataKey="maxHeartRateMax"
            chartData={chartData}
            unit=" bpm"
          />
        </div>
      )}
    </div>
  );
}

function MetricBlock({
  title,
  icon: Icon,
  color,
  dataKey,
  chartData,
  unit,
}: {
  title: string;
  icon: typeof Heart;
  color: string;
  dataKey: keyof (typeof chartData)[number];
  chartData: Record<string, string | number | null>[];
  unit: string;
}) {
  const filtered = chartData.filter((d) => d[dataKey] != null && Number(d[dataKey]) > 0);
  if (filtered.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-600" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} width={44} />
            <Tooltip
              formatter={(v: number) => [`${v}${unit}`, ""]}
              labelFormatter={(_, p) => (p?.length ? String(p[0]?.payload?.day ?? "") : "")}
              contentStyle={{
                backgroundColor: "var(--tooltip-bg, #fff)",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey={dataKey as string}
              name={title}
              stroke={color}
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
