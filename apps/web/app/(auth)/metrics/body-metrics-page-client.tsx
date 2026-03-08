"use client";

import { useCallback, useState } from "react";
import { Scale } from "lucide-react";
import { BodyMetricForm } from "@/components/features/metrics/body-metric-form";
import {
  BodyMetricsList,
  type BodyMetricEntry,
} from "@/components/features/metrics/body-metrics-list";

type Props = {
  initialMetrics: BodyMetricEntry[];
  preferredUnit: string;
};

export function BodyMetricsPageClient({
  initialMetrics,
  preferredUnit,
}: Props) {
  const [metrics, setMetrics] = useState<BodyMetricEntry[]>(initialMetrics);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/body-metrics");
    if (res.ok) {
      const data = await res.json();
      setMetrics(
        data.map(
          (m: {
            id: string;
            date: string;
            weight: number | null;
            bodyFatPct: number | null;
            muscleMass: number | null;
            bmi: number | null;
            notes: string | null;
          }) => ({
            id: m.id,
            date: m.date,
            weight: m.weight,
            bodyFatPct: m.bodyFatPct,
            muscleMass: m.muscleMass,
            bmi: m.bmi,
            notes: m.notes,
          })
        )
      );
    }
  }, []);

  const handleDelete = useCallback((id: string) => {
    setMetrics((prev) => prev.filter((m) => m.id !== id));
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Scale className="w-7 h-7" />
          Body metrics
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Track weight, body fat, muscle mass, and measurements over time.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Add entry
        </h2>
        <BodyMetricForm preferredUnit={preferredUnit} onSuccess={refresh} />
      </div>

      <div>
        <BodyMetricsList
          metrics={metrics}
          preferredUnit={preferredUnit}
          onDelete={handleDelete}
          onRefresh={refresh}
        />
      </div>
    </div>
  );
}
