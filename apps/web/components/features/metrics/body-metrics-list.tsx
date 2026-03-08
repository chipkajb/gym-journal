"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export type BodyMetricEntry = {
  id: string;
  date: string;
  weight: number | null;
  bodyFatPct: number | null;
  muscleMass: number | null;
  bmi: number | null;
  notes: string | null;
};

type Props = {
  metrics: BodyMetricEntry[];
  preferredUnit: string;
  onDelete: (id: string) => void;
  onRefresh: () => void;
};

export function BodyMetricsList({
  metrics,
  preferredUnit,
  onDelete,
  onRefresh,
}: Props) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const weightUnit = preferredUnit === "imperial" ? "lbs" : "kg";
  const massUnit = preferredUnit === "imperial" ? "lbs" : "kg";

  const weightChartData = metrics
    .filter((m) => m.weight != null)
    .map((m) => ({
      date: format(parseISO(m.date), "MMM d"),
      fullDate: m.date,
      weight: m.weight,
    }))
    .reverse();

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/body-metrics/${id}`, { method: "DELETE" });
      if (res.ok) {
        onDelete(id);
        onRefresh();
      }
    } finally {
      setDeletingId(null);
    }
  }

  if (metrics.length === 0) {
    return (
      <p className="text-gray-500 dark:text-gray-400">
        No body metrics yet. Add an entry above to track weight, body fat, and more.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {weightChartData.length > 0 && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Weight over time ({weightUnit})
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightChartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-600" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  className="text-gray-500 dark:text-gray-400"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  className="text-gray-500 dark:text-gray-400"
                  unit={weightUnit}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--tooltip-bg, #fff)",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [`${value} ${weightUnit}`, "Weight"]}
                  labelFormatter={(_, payload) =>
                    payload?.[0]?.payload?.fullDate
                      ? format(parseISO(payload[0].payload.fullDate), "PPP")
                      : ""
                  }
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="rgb(59, 130, 246)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Recent entries</h3>
        <ul className="space-y-2">
          {metrics.map((m) => (
            <li
              key={m.id}
              className="flex flex-wrap items-center gap-3 p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
            >
              <span className="font-medium text-gray-900 dark:text-white">
                {format(parseISO(m.date), "MMM d, yyyy")}
              </span>
              {m.weight != null && (
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {m.weight} {weightUnit}
                </span>
              )}
              {m.bodyFatPct != null && (
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {m.bodyFatPct}% body fat
                </span>
              )}
              {m.muscleMass != null && (
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {m.muscleMass} {massUnit} muscle
                </span>
              )}
              {m.bmi != null && (
                <span className="text-sm text-gray-600 dark:text-gray-300">BMI {m.bmi}</span>
              )}
              {m.notes && (
                <span className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                  {m.notes}
                </span>
              )}
              <button
                type="button"
                onClick={() => handleDelete(m.id)}
                disabled={deletingId === m.id}
                className="ml-auto text-sm text-red-600 dark:text-red-400 hover:underline disabled:opacity-50"
              >
                {deletingId === m.id ? "Deleting…" : "Delete"}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
