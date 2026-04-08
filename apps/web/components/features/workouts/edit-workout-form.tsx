"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WorkoutNameGenerator } from "./workout-name-generator";
import { ChevronDown, ChevronUp } from "lucide-react";

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
    calories: string;
    maxHeartRate: string;
    avgHeartRate: string;
    totalDurationSeconds: string;
    timedDurationSeconds: string;
  };
};

const SCORE_TYPES = ["", "Time", "Reps", "Load", "Rounds + Reps", "Rounds"];
const RX_OPTIONS = ["", "RX", "SCALED"];

function formatDurationSec(secs: string): string {
  const n = parseInt(secs, 10);
  if (isNaN(n) || n <= 0) return secs;
  const m = Math.floor(n / 60);
  const s = n % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function parseDurationInput(val: string): number | null {
  if (!val.trim()) return null;
  if (val.includes(":")) {
    const parts = val.split(":").map(Number);
    if (parts.length === 2) return (parts[0] ?? 0) * 60 + (parts[1] ?? 0);
    if (parts.length === 3) return (parts[0] ?? 0) * 3600 + (parts[1] ?? 0) * 60 + (parts[2] ?? 0);
  }
  const n = Number(val);
  return isNaN(n) ? null : n * 60;
}

export function EditWorkoutForm({ sessionId, initial }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [workoutDate, setWorkoutDate] = useState(initial.workoutDate);
  const [bestResultDisplay, setBestResultDisplay] = useState(initial.bestResultDisplay);
  const [bestResultRaw, setBestResultRaw] = useState(initial.bestResultRaw);
  const [scoreType, setScoreType] = useState(initial.scoreType);
  const [barbellLift, setBarbellLift] = useState(initial.barbellLift);
  const [notes, setNotes] = useState(initial.notes);
  const [rxOrScaled, setRxOrScaled] = useState(initial.rxOrScaled);
  // Health metrics
  const [calories, setCalories] = useState(initial.calories);
  const [maxHeartRate, setMaxHeartRate] = useState(initial.maxHeartRate);
  const [avgHeartRate, setAvgHeartRate] = useState(initial.avgHeartRate);
  const [totalDurationInput, setTotalDurationInput] = useState(
    initial.totalDurationSeconds ? formatDurationSec(initial.totalDurationSeconds) : ""
  );
  const [timedDurationInput, setTimedDurationInput] = useState(
    initial.timedDurationSeconds ? formatDurationSec(initial.timedDurationSeconds) : ""
  );
  const [showHealthMetrics, setShowHealthMetrics] = useState(
    !!(initial.calories || initial.maxHeartRate || initial.avgHeartRate || initial.totalDurationSeconds)
  );
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
          bestResultRaw: bestResultRaw === "" ? null : parseFloat(bestResultRaw),
          scoreType: scoreType || null,
          barbellLift: barbellLift.trim() || null,
          notes: notes.trim() || null,
          rxOrScaled: rxOrScaled || null,
          calories: calories === "" ? null : parseInt(calories, 10),
          maxHeartRate: maxHeartRate === "" ? null : parseInt(maxHeartRate, 10),
          avgHeartRate: avgHeartRate === "" ? null : parseInt(avgHeartRate, 10),
          totalDurationSeconds: parseDurationInput(totalDurationInput),
          timedDurationSeconds: parseDurationInput(timedDurationInput),
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
    <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-6 space-y-4 max-w-lg">
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded">
          {error}
        </p>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-foreground mb-1">Workout title</label>
        <input
          id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground mb-2"
          required
        />
        <WorkoutNameGenerator
          description={description || undefined}
          scoreType={scoreType || undefined}
          barbellLift={barbellLift || undefined}
          existingTitle={title || undefined}
          onSelect={(name) => setTitle(name)}
        />
      </div>

      <div>
        <label htmlFor="workoutDate" className="block text-sm font-medium text-foreground mb-1">Date</label>
        <input
          id="workoutDate" type="date" value={workoutDate} onChange={(e) => setWorkoutDate(e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
        />
      </div>

      <div>
        <label htmlFor="scoreType" className="block text-sm font-medium text-foreground mb-1">Score type</label>
        <select
          id="scoreType" value={scoreType} onChange={(e) => setScoreType(e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
        >
          {SCORE_TYPES.map((s) => (
            <option key={s || "none"} value={s}>{s || "—"}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="bestResultDisplay" className="block text-sm font-medium text-foreground mb-1">Result (display)</label>
        <input
          id="bestResultDisplay" type="text" value={bestResultDisplay}
          onChange={(e) => setBestResultDisplay(e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
        />
      </div>

      <div>
        <label htmlFor="bestResultRaw" className="block text-sm font-medium text-foreground mb-1">Result (raw)</label>
        <input
          id="bestResultRaw" type="text" inputMode="decimal" value={bestResultRaw}
          onChange={(e) => setBestResultRaw(e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
        />
      </div>

      <div>
        <label htmlFor="barbellLift" className="block text-sm font-medium text-foreground mb-1">Barbell lift</label>
        <input
          id="barbellLift" type="text" value={barbellLift} onChange={(e) => setBarbellLift(e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
        />
      </div>

      <div>
        <label htmlFor="rxOrScaled" className="block text-sm font-medium text-foreground mb-1">RX or Scaled</label>
        <select
          id="rxOrScaled" value={rxOrScaled} onChange={(e) => setRxOrScaled(e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
        >
          {RX_OPTIONS.map((o) => (
            <option key={o || "none"} value={o}>{o || "—"}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-foreground mb-1">Notes</label>
        <textarea
          id="notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
        />
      </div>

      <div className="border-t border-border pt-3">
        <button
          type="button"
          onClick={() => setShowHealthMetrics((v) => !v)}
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          {showHealthMetrics ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          Health & performance data
          <span className="text-xs font-normal">(from your smartwatch)</span>
        </button>

        {showHealthMetrics && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="calories" className="block text-xs font-medium text-muted-foreground mb-1">Calories burned</label>
              <input
                id="calories" type="number" inputMode="numeric" value={calories}
                onChange={(e) => setCalories(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm"
                placeholder="e.g. 420" min={0}
              />
            </div>
            <div>
              <label htmlFor="maxHeartRate" className="block text-xs font-medium text-muted-foreground mb-1">Max HR (bpm)</label>
              <input
                id="maxHeartRate" type="number" inputMode="numeric" value={maxHeartRate}
                onChange={(e) => setMaxHeartRate(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm"
                placeholder="e.g. 182" min={0} max={250}
              />
            </div>
            <div>
              <label htmlFor="avgHeartRate" className="block text-xs font-medium text-muted-foreground mb-1">Avg HR (bpm)</label>
              <input
                id="avgHeartRate" type="number" inputMode="numeric" value={avgHeartRate}
                onChange={(e) => setAvgHeartRate(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm"
                placeholder="e.g. 155" min={0} max={250}
              />
            </div>
            <div>
              <label htmlFor="totalDuration" className="block text-xs font-medium text-muted-foreground mb-1">Total time (mm:ss)</label>
              <input
                id="totalDuration" type="text" value={totalDurationInput}
                onChange={(e) => setTotalDurationInput(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm"
                placeholder="e.g. 45:00"
              />
              <p className="text-xs text-muted-foreground mt-0.5">Incl. warm-up & cool-down</p>
            </div>
            <div>
              <label htmlFor="timedDuration" className="block text-xs font-medium text-muted-foreground mb-1">Timer result (mm:ss)</label>
              <input
                id="timedDuration" type="text" value={timedDurationInput}
                onChange={(e) => setTimedDurationInput(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm"
                placeholder="e.g. 10:44"
              />
              <p className="text-xs text-muted-foreground mt-0.5">In-app timer result</p>
            </div>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-semibold rounded-lg transition-colors"
      >
        {loading ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
