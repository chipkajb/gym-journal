"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Exercise = { id: string; name: string; category: string };

type Props = {
  sessionId: string;
  exercises: Exercise[];
  nextOrderIndex: number;
};

export function AddExerciseLogForm({
  sessionId,
  exercises,
  nextOrderIndex,
}: Props) {
  const router = useRouter();
  const [exerciseId, setExerciseId] = useState("");
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");
  const [duration, setDuration] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!exerciseId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseId,
          orderIndex: nextOrderIndex,
          sets: sets ? parseInt(sets, 10) : null,
          reps: reps ? parseInt(reps, 10) : null,
          weight: weight ? parseFloat(weight) : null,
          duration: duration ? parseInt(duration, 10) : null,
        }),
      });
      if (!res.ok) {
        setLoading(false);
        return;
      }
      setExerciseId("");
      setSets("");
      setReps("");
      setWeight("");
      setDuration("");
      router.refresh();
    } catch {
      // ignore
    }
    setLoading(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-3"
    >
      <h3 className="font-medium text-gray-900 dark:text-white">
        Log exercise
      </h3>
      <div className="flex flex-wrap gap-3 items-end">
        <div className="min-w-[180px]">
          <label
            htmlFor="exercise"
            className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1"
          >
            Exercise
          </label>
          <select
            id="exercise"
            value={exerciseId}
            onChange={(e) => setExerciseId(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Select…</option>
            {exercises.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name}
              </option>
            ))}
          </select>
        </div>
        <div className="w-20">
          <label
            htmlFor="sets"
            className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1"
          >
            Sets
          </label>
          <input
            id="sets"
            type="number"
            min={0}
            value={sets}
            onChange={(e) => setSets(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <div className="w-20">
          <label
            htmlFor="reps"
            className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1"
          >
            Reps
          </label>
          <input
            id="reps"
            type="number"
            min={0}
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <div className="w-20">
          <label
            htmlFor="weight"
            className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1"
          >
            Weight
          </label>
          <input
            id="weight"
            type="number"
            min={0}
            step={0.5}
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <div className="w-24">
          <label
            htmlFor="duration"
            className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1"
          >
            Duration (s)
          </label>
          <input
            id="duration"
            type="number"
            min={0}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Adding…" : "Add"}
        </button>
      </div>
    </form>
  );
}
