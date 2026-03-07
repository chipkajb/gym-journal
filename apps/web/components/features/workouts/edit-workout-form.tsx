"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  sessionId: string;
  initial: {
    title: string;
    description: string;
    workoutDate: string;
    bestResultDisplay: string;
    bestResultRaw: string;
    scoreType: string;
    barbellLift: string;
    notes: string;
    rxOrScaled: string;
    isPr: boolean;
  };
};

const SCORE_TYPES = ["", "Time", "Reps", "Load", "Rounds + Reps", "Rounds"];
const RX_OPTIONS = ["", "RX", "SCALED"];

export function EditWorkoutForm({ sessionId, initial }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [workoutDate, setWorkoutDate] = useState(initial.workoutDate);
  const [bestResultDisplay, setBestResultDisplay] = useState(
    initial.bestResultDisplay
  );
  const [bestResultRaw, setBestResultRaw] = useState(initial.bestResultRaw);
  const [scoreType, setScoreType] = useState(initial.scoreType);
  const [barbellLift, setBarbellLift] = useState(initial.barbellLift);
  const [notes, setNotes] = useState(initial.notes);
  const [rxOrScaled, setRxOrScaled] = useState(initial.rxOrScaled);
  const [isPr, setIsPr] = useState(initial.isPr);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          workoutDate: new Date(workoutDate).toISOString(),
          bestResultDisplay: bestResultDisplay.trim() || null,
          bestResultRaw:
            bestResultRaw === "" ? null : parseFloat(bestResultRaw),
          scoreType: scoreType || null,
          barbellLift: barbellLift.trim() || null,
          notes: notes.trim() || null,
          rxOrScaled: rxOrScaled || null,
          isPr,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error?.title?.[0] ?? "Failed to update");
        setLoading(false);
        return;
      }
      router.push(`/workouts/${sessionId}`);
      router.refresh();
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 space-y-4 max-w-lg"
    >
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded">
          {error}
        </p>
      )}

      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Workout title
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          required
        />
      </div>

      <div>
        <label
          htmlFor="workoutDate"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Date
        </label>
        <input
          id="workoutDate"
          type="date"
          value={workoutDate}
          onChange={(e) => setWorkoutDate(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      <div>
        <label
          htmlFor="scoreType"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Score type
        </label>
        <select
          id="scoreType"
          value={scoreType}
          onChange={(e) => setScoreType(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          {SCORE_TYPES.map((s) => (
            <option key={s || "none"} value={s}>
              {s || "—"}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="bestResultDisplay"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Result (display)
        </label>
        <input
          id="bestResultDisplay"
          type="text"
          value={bestResultDisplay}
          onChange={(e) => setBestResultDisplay(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      <div>
        <label
          htmlFor="bestResultRaw"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Result (raw)
        </label>
        <input
          id="bestResultRaw"
          type="text"
          inputMode="decimal"
          value={bestResultRaw}
          onChange={(e) => setBestResultRaw(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      <div>
        <label
          htmlFor="barbellLift"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Barbell lift
        </label>
        <input
          id="barbellLift"
          type="text"
          value={barbellLift}
          onChange={(e) => setBarbellLift(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      <div>
        <label
          htmlFor="rxOrScaled"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          RX or scaled
        </label>
        <select
          id="rxOrScaled"
          value={rxOrScaled}
          onChange={(e) => setRxOrScaled(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          {RX_OPTIONS.map((o) => (
            <option key={o || "none"} value={o}>
              {o || "—"}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="notes"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Notes
        </label>
        <textarea
          id="notes"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={isPr}
          onChange={(e) => setIsPr(e.target.checked)}
          className="rounded"
        />
        <span className="text-gray-700 dark:text-gray-300">Personal record (PR)</span>
      </label>

      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg"
      >
        {loading ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
