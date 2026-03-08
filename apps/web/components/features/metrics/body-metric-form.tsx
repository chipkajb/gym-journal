"use client";

import { useState } from "react";

type BodyMetricFormData = {
  date: string;
  weight: string;
  bodyFatPct: string;
  muscleMass: string;
  bmi: string;
  notes: string;
};

type Props = {
  preferredUnit: string;
  onSuccess: () => void;
  initialDate?: string;
};

export function BodyMetricForm({
  preferredUnit,
  onSuccess,
  initialDate = new Date().toISOString().slice(0, 10),
}: Props) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<BodyMetricFormData>({
    date: initialDate,
    weight: "",
    bodyFatPct: "",
    muscleMass: "",
    bmi: "",
    notes: "",
  });

  const weightLabel = preferredUnit === "imperial" ? "Weight (lbs)" : "Weight (kg)";
  const massLabel = preferredUnit === "imperial" ? "Muscle mass (lbs)" : "Muscle mass (kg)";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/body-metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: form.date,
          weight: form.weight ? Number(form.weight) : null,
          bodyFatPct: form.bodyFatPct ? Number(form.bodyFatPct) : null,
          muscleMass: form.muscleMass ? Number(form.muscleMass) : null,
          bmi: form.bmi ? Number(form.bmi) : null,
          notes: form.notes.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to save.");
        return;
      }
      setForm({
        date: form.date,
        weight: "",
        bodyFatPct: "",
        muscleMass: "",
        bmi: "",
        notes: "",
      });
      onSuccess();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded">
          {error}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Date</label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            required
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{weightLabel}</label>
          <input
            type="number"
            step="0.1"
            min="0"
            placeholder="e.g. 75"
            value={form.weight}
            onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Body fat %</label>
          <input
            type="number"
            step="0.1"
            min="0"
            max="100"
            placeholder="e.g. 18"
            value={form.bodyFatPct}
            onChange={(e) => setForm((f) => ({ ...f, bodyFatPct: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{massLabel}</label>
          <input
            type="number"
            step="0.1"
            min="0"
            placeholder="e.g. 60"
            value={form.muscleMass}
            onChange={(e) => setForm((f) => ({ ...f, muscleMass: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">BMI</label>
          <input
            type="number"
            step="0.1"
            min="0"
            placeholder="e.g. 22.5"
            value={form.bmi}
            onChange={(e) => setForm((f) => ({ ...f, bmi: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Notes</label>
        <input
          type="text"
          placeholder="Optional"
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>
      <button
        type="submit"
        disabled={saving}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg"
      >
        {saving ? "Saving…" : "Add entry"}
      </button>
    </form>
  );
}
