"use client";

import { useState, useCallback } from "react";
import { GripVertical, Trash2, Plus } from "lucide-react";

type TemplateExerciseRow = {
  id: string;
  exerciseId: string;
  exerciseName: string;
  orderIndex: number;
  sets: number | null;
  reps: number | null;
  duration: number | null;
  restTime: number | null;
  notes: string | null;
};

type Exercise = { id: string; name: string; category: string };

type Props = {
  templateId: string;
  templateExercises: TemplateExerciseRow[];
  allExercises: Exercise[];
};

export function TemplateExercisesEditor({
  templateId,
  templateExercises: initial,
  allExercises,
}: Props) {
  const [rows, setRows] = useState<TemplateExerciseRow[]>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [addExerciseId, setAddExerciseId] = useState("");

  const save = useCallback(
    async (newRows: TemplateExerciseRow[]) => {
      setError("");
      setSaving(true);
      try {
        const res = await fetch(`/api/templates/${templateId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            exercises: newRows.map((r, i) => ({
              exerciseId: r.exerciseId,
              orderIndex: i,
              sets: r.sets,
              reps: r.reps,
              duration: r.duration,
              restTime: r.restTime,
              notes: r.notes,
            })),
          }),
        });
        if (!res.ok) {
          setError("Failed to save exercises");
          setSaving(false);
          return;
        }
        const data = await res.json();
        setRows(
          data.exercises.map((e: { id: string; exerciseId: string; exercise: { name: string }; orderIndex: number; sets: number | null; reps: number | null; duration: number | null; restTime: number | null; notes: string | null }) => ({
            id: e.id,
            exerciseId: e.exerciseId,
            exerciseName: e.exercise.name,
            orderIndex: e.orderIndex,
            sets: e.sets,
            reps: e.reps,
            duration: e.duration,
            restTime: e.restTime,
            notes: e.notes,
          }))
        );
      } catch {
        setError("Failed to save");
      }
      setSaving(false);
    },
    [templateId]
  );

  function addExercise() {
    if (!addExerciseId) return;
    const ex = allExercises.find((e) => e.id === addExerciseId);
    if (!ex) return;
    const newRow: TemplateExerciseRow = {
      id: `new-${Date.now()}`,
      exerciseId: ex.id,
      exerciseName: ex.name,
      orderIndex: rows.length,
      sets: null,
      reps: null,
      duration: null,
      restTime: null,
      notes: null,
    };
    const newRows = [...rows, newRow];
    setRows(newRows);
    setAddExerciseId("");
    save(newRows);
  }

  function removeRow(index: number) {
    const newRows = rows.filter((_, i) => i !== index);
    setRows(newRows);
    save(newRows);
  }

  function updateRow(index: number, updates: Partial<TemplateExerciseRow>) {
    const newRows = rows.map((r, i) =>
      i === index ? { ...r, ...updates } : r
    );
    setRows(newRows);
    save(newRows);
  }

  const usedIds = new Set(rows.map((r) => r.exerciseId));
  const availableExercises = allExercises.filter((e) => !usedIds.has(e.id));

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        Exercises
      </h2>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <ul className="space-y-2">
        {rows.map((row, index) => (
          <li
            key={row.id}
            className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50"
          >
            <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 dark:text-white truncate">
                {row.exerciseName}
              </p>
              <div className="flex flex-wrap gap-2 mt-1">
                <input
                  type="number"
                  min={0}
                  placeholder="Sets"
                  value={row.sets ?? ""}
                  onChange={(e) =>
                    updateRow(index, {
                      sets: e.target.value ? parseInt(e.target.value, 10) : null,
                    })
                  }
                  className="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <input
                  type="number"
                  min={0}
                  placeholder="Reps"
                  value={row.reps ?? ""}
                  onChange={(e) =>
                    updateRow(index, {
                      reps: e.target.value ? parseInt(e.target.value, 10) : null,
                    })
                  }
                  className="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => removeRow(index)}
              className="p-2 rounded text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              aria-label="Remove exercise"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </li>
        ))}
      </ul>

      {availableExercises.length > 0 && (
        <div className="flex gap-2 flex-wrap items-center">
          <select
            value={addExerciseId}
            onChange={(e) => setAddExerciseId(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-w-[180px]"
          >
            <option value="">Add exercise…</option>
            {availableExercises.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name} ({ex.category})
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={addExercise}
            disabled={!addExerciseId || saving}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
      )}

      {saving && (
        <p className="text-sm text-gray-500 dark:text-gray-400">Saving…</p>
      )}
    </div>
  );
}
