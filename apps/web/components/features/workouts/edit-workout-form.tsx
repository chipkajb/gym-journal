"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  displayToRaw,
  validateDisplayResult,
  bestOneRmFromLoadSetDetails,
  formatLoadSetsForNotes,
  parseValidLoadSets,
  validateLoadSetRows,
} from "@/lib/workout-utils";
import { SCORE_TYPES, type ScoreType, isValidScoreType } from "@/lib/score-types";
import { formatClock, parseDurationInput } from "@/lib/duration";
import { HealthMetricsFields, ScoreFields, type LoadSetRow } from "@/components/features/workouts/workout-form-fields";

type Props = {
  sessionId: string;
  initial: {
    title: string;
    description: string;
    workoutDate: string;
    bestResultDisplay: string;
    bestResultRaw: string;
    scoreType: string;
    notes: string;
    rxOrScaled: string;
    calories: string;
    maxHeartRate: string;
    avgHeartRate: string;
    totalDurationSeconds: string;
    setDetails: unknown;
  };
};



/**
 * Parse "225 x 5" display format (old records) into weight/reps.
 * New records store this in setDetails instead.
 */
function parseLoadDisplay(display: string): { weight: string; reps: string } {
  const match = display.match(/^(\d+(?:\.\d+)?)\s*x\s*(\d+)$/);
  if (match) return { weight: match[1]!, reps: match[2]! };
  const single = display.match(/^(\d+(?:\.\d+)?)$/);
  if (single) return { weight: single[1]!, reps: "1" };
  return { weight: display, reps: "1" };
}

function initialLoadSets(
  scoreType: string,
  setDetails: unknown,
  bestResultDisplay: string
): LoadSetRow[] {
  if (scoreType !== "Load") return [{ weight: "", reps: "" }];
  const o = setDetails as {
    sets?: { weight: number; reps: number }[];
    weight?: number;
    reps?: number;
  } | null;
  if (o?.sets && Array.isArray(o.sets) && o.sets.length > 0) {
    return o.sets.map((s) => ({ weight: String(s.weight), reps: String(s.reps) }));
  }
  if (o && typeof o.weight === "number" && typeof o.reps === "number") {
    return [{ weight: String(o.weight), reps: String(o.reps) }];
  }
  const p = parseLoadDisplay(bestResultDisplay);
  return [{ weight: p.weight, reps: p.reps }];
}

export function EditWorkoutForm({ sessionId, initial }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [workoutDate, setWorkoutDate] = useState(initial.workoutDate);
  const [scoreType, setScoreType] = useState<ScoreType>(
    isValidScoreType(initial.scoreType) ? initial.scoreType : "Time"
  );
  const [bestResultDisplay, setBestResultDisplay] = useState(initial.bestResultDisplay);
  const [notes, setNotes] = useState(initial.notes);
  const [rxOrScaled, setRxOrScaled] = useState(() =>
    initial.rxOrScaled === "RX" || initial.rxOrScaled === "SCALED" ? initial.rxOrScaled : ""
  );
  const [calories, setCalories] = useState(initial.calories);
  const [maxHeartRate, setMaxHeartRate] = useState(initial.maxHeartRate);
  const [avgHeartRate, setAvgHeartRate] = useState(initial.avgHeartRate);
  const [totalDurationInput, setTotalDurationInput] = useState(
    initial.totalDurationSeconds ? formatClock(Number(initial.totalDurationSeconds)) : ""
  );
  const [showHealthMetrics, setShowHealthMetrics] = useState(
    !!(initial.calories || initial.maxHeartRate || initial.avgHeartRate || initial.totalDurationSeconds)
  );

  const [loadSets, setLoadSets] = useState<LoadSetRow[]>(() =>
    initialLoadSets(initial.scoreType, initial.setDetails, initial.bestResultDisplay)
  );

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isLoadType = scoreType === "Load";

  const displayError =
    scoreType && bestResultDisplay && !isLoadType
      ? validateDisplayResult(bestResultDisplay, scoreType)
      : null;

  useEffect(() => {
    if (!isLoadType) return;
    const sets = parseValidLoadSets(loadSets);
    const best = sets.length ? bestOneRmFromLoadSetDetails({ sets }) : null;
    setBestResultDisplay(best != null ? String(best) : "");
  }, [isLoadType, loadSets]);

  function deriveRaw(): number | null {
    if (isLoadType) {
      const sets = parseValidLoadSets(loadSets);
      return sets.length ? bestOneRmFromLoadSetDetails({ sets }) : null;
    }
    if (bestResultDisplay && scoreType) {
      return displayToRaw(bestResultDisplay, scoreType);
    }
    return null;
  }

  const estimated1RM =
    isLoadType && bestResultDisplay.trim()
      ? parseFloat(bestResultDisplay)
      : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!description.trim()) {
      setError("Workout description is required.");
      return;
    }
    if (!isLoadType) {
      if (rxOrScaled !== "RX" && rxOrScaled !== "SCALED") {
        setError("Select RX or Scaled.");
        return;
      }
    }
    const bestResultRawPreview = deriveRaw();
    if (isLoadType) {
      const rowErr = validateLoadSetRows(loadSets);
      if (rowErr) {
        setError(rowErr);
        return;
      }
      if (bestResultRawPreview == null) {
        setError("Add at least one set with weight and reps.");
        return;
      }
    } else {
      if (!bestResultDisplay.trim()) {
        setError("Enter your workout result.");
        return;
      }
      const err = validateDisplayResult(bestResultDisplay, scoreType);
      if (err) {
        setError(`Result: ${err}`);
        return;
      }
    }
    setLoading(true);
    try {
      const bestResultRaw = bestResultRawPreview;
      const loadSetDetails = (() => {
        if (!isLoadType) return null;
        const sets = parseValidLoadSets(loadSets);
        return sets.length ? { sets } : null;
      })();

      const loadNotes = isLoadType ? formatLoadSetsForNotes(loadSets) : "";
      const mergedNotes =
        loadNotes && notes.trim()
          ? `${notes.trim()}\n\n${loadNotes}`
          : loadNotes || notes.trim() || null;

      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          workoutDate,
          bestResultDisplay: bestResultDisplay.trim() || null,
          bestResultRaw,
          scoreType,
          setDetails: loadSetDetails,
          notes: mergedNotes,
          rxOrScaled: isLoadType ? null : rxOrScaled,
          calories: calories === "" ? null : parseInt(calories, 10),
          maxHeartRate: maxHeartRate === "" ? null : parseInt(maxHeartRate, 10),
          avgHeartRate: avgHeartRate === "" ? null : parseInt(avgHeartRate, 10),
          totalDurationSeconds: parseDurationInput(totalDurationInput),
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

  const healthSetters = {
    calories: setCalories,
    totalDuration: setTotalDurationInput,
    avgHeartRate: setAvgHeartRate,
    maxHeartRate: setMaxHeartRate,
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-border bg-card p-6 space-y-4 max-w-lg"
    >
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded">
          {error}
        </p>
      )}

      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-foreground mb-1"
        >
          Workout title
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground mb-2"
          required
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-foreground mb-1"
        >
          Workout description
        </label>
        <textarea
          id="description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm"
        />
      </div>

      <div>
        <label
          htmlFor="workoutDate"
          className="block text-sm font-medium text-foreground mb-1"
        >
          Date
        </label>
        <input
          id="workoutDate"
          type="date"
          value={workoutDate}
          onChange={(e) => setWorkoutDate(e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
        />
      </div>

      <div>
        <label
          htmlFor="scoreType"
          className="block text-sm font-medium text-foreground mb-1"
        >
          Score type
        </label>
        <select
          id="scoreType"
          value={scoreType}
          onChange={(e) => {
            const v = e.target.value as ScoreType;
            setScoreType(v);
            setBestResultDisplay("");
            setLoadSets([{ weight: "", reps: "" }]);
          }}
          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
        >
          {SCORE_TYPES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <ScoreFields
        scoreType={scoreType}
        loadSets={loadSets}
        setLoadSets={setLoadSets}
        estimated1RM={estimated1RM}
        bestResultDisplay={bestResultDisplay}
        setBestResultDisplay={setBestResultDisplay}
        displayError={displayError}
        rxOrScaled={rxOrScaled}
        setRxOrScaled={setRxOrScaled}
      />

      <div>
        <label
          htmlFor="notes"
          className="block text-sm font-medium text-foreground mb-1"
        >
          Notes
        </label>
        <textarea
          id="notes"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
        />
      </div>

      <HealthMetricsFields
        open={showHealthMetrics}
        onToggle={() => setShowHealthMetrics((v) => !v)}
        values={{
          calories,
          totalDuration: totalDurationInput,
          avgHeartRate,
          maxHeartRate,
        }}
        onChange={(key, v) => healthSetters[key](v)}
      />

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
