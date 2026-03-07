"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Log = {
  id: string;
  exerciseId: string;
  orderIndex: number;
  sets: number | null;
  reps: number | null;
  weight: number | null;
  duration: number | null;
  distance: number | null;
  notes: string | null;
  exercise: { name: string };
};

type Props = {
  sessionId: string;
  logs: Log[];
  isCompleted: boolean;
};

export function ExerciseLogList({ sessionId, logs, isCompleted }: Props) {
  const router = useRouter();
  const [completing, setCompleting] = useState(false);

  async function finishWorkout() {
    setCompleting(true);
    try {
      await fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completedAt: true }),
      });
      router.refresh();
    } finally {
      setCompleting(false);
    }
  }

  if (logs.length === 0 && !isCompleted) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-6 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          No exercises logged yet. Add one below.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        Exercises
      </h2>
      <ul className="space-y-2">
        {logs.map((log) => (
          <li
            key={log.id}
            className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
          >
            <span className="font-medium text-gray-900 dark:text-white">
              {log.exercise.name}
            </span>
            {(log.sets != null || log.reps != null || log.weight != null || log.duration != null) && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {[
                  log.sets != null && `${log.sets} sets`,
                  log.reps != null && `${log.reps} reps`,
                  log.weight != null && `${log.weight} kg`,
                  log.duration != null && `${log.duration}s`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            )}
          </li>
        ))}
      </ul>

      {!isCompleted && (
        <div className="pt-2">
          <button
            type="button"
            onClick={finishWorkout}
            disabled={completing}
            className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
          >
            {completing ? "Finishing…" : "Finish workout"}
          </button>
        </div>
      )}
    </div>
  );
}
