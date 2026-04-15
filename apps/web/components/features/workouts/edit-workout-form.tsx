"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  displayToRaw,
  validateDisplayResult,
  getResultPlaceholder,
  bestOneRmFromLoadSetDetails,
  formatLoadSetsForNotes,
} from "@/lib/workout-utils";
import { SCORE_TYPES, type ScoreType, isValidScoreType } from "@/lib/score-types";

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

const RX_VALUES = ["RX", "SCALED"] as const;

type LoadSetRow = { weight: string; reps: string };

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
  if (scoreType !== "Load") return [{ weight: "", reps: "1" }];
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
    if (parts.length === 3)
      return (parts[0] ?? 0) * 3600 + (parts[1] ?? 0) * 60 + (parts[2] ?? 0);
  }
  const n = Number(val);
  return isNaN(n) ? null : n * 60;
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
    initial.totalDurationSeconds ? formatDurationSec(initial.totalDurationSeconds) : ""
  );
  const [showHealthMetrics, setShowHealthMetrics] = useState(
    !!(initial.calories || initial.maxHeartRate || initial.avgHeartRate || initial.totalDurationSeconds)
  );

  const [loadSets, setLoadSets] = useState<LoadSetRow[]>(() =>
    initialLoadSets(initial.scoreType, initial.setDetails, initial.bestResultDisplay)
  );

  const [displayError, setDisplayError] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isLoadType = scoreType === "Load";

  // Validate display whenever it or scoreType changes
  useEffect(() => {
    if (scoreType && bestResultDisplay && !isLoadType) {
      setDisplayError(validateDisplayResult(bestResultDisplay, scoreType));
    } else {
      setDisplayError(null);
    }
  }, [bestResultDisplay, scoreType, isLoadType]);

  useEffect(() => {
    if (!isLoadType) return;
    const setsPayload = {
      sets: loadSets
        .map((s) => ({
          weight: parseFloat(s.weight),
          reps: parseInt(s.reps, 10) || 1,
        }))
        .filter((s) => !isNaN(s.weight) && s.weight > 0),
    };
    const best = bestOneRmFromLoadSetDetails(setsPayload);
    setBestResultDisplay(best != null ? String(best) : "");
  }, [isLoadType, loadSets]);

  function deriveRaw(): number | null {
    if (isLoadType) {
      const sets = loadSets
        .map((s) => ({
          weight: parseFloat(s.weight),
          reps: parseInt(s.reps, 10) || 1,
        }))
        .filter((s) => !isNaN(s.weight) && s.weight > 0);
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
      if (bestResultRawPreview == null) {
        setError("Add at least one set with a valid weight.");
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
        const sets = loadSets
          .map((s) => ({
            weight: parseFloat(s.weight),
            reps: parseInt(s.reps, 10) || 1,
          }))
          .filter((s) => !isNaN(s.weight) && s.weight > 0);
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
          workoutDate: new Date(workoutDate).toISOString(),
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
            setLoadSets([{ weight: "", reps: "1" }]);
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

      {/* Result — Load special case */}
      {isLoadType ? (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-foreground">Sets</label>
          {loadSets.map((row, idx) => (
            <div key={idx} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Weight</label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={row.weight}
                  onChange={(e) => {
                    const v = e.target.value;
                    setLoadSets((rows) => rows.map((r, i) => (i === idx ? { ...r, weight: v } : r)));
                  }}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                  placeholder="225"
                  min={0}
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Reps</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={row.reps}
                  onChange={(e) => {
                    const v = e.target.value;
                    setLoadSets((rows) => rows.map((r, i) => (i === idx ? { ...r, reps: v } : r)));
                  }}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                  placeholder="1"
                  min={1}
                />
              </div>
              {loadSets.length > 1 && (
                <button
                  type="button"
                  onClick={() => setLoadSets((rows) => rows.filter((_, i) => i !== idx))}
                  className="px-2 py-2 text-xs text-muted-foreground hover:text-destructive border border-border rounded-lg"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => setLoadSets((rows) => [...rows, { weight: "", reps: "1" }])}
            className="text-sm font-medium text-primary hover:underline"
          >
            + Add set
          </button>
          {estimated1RM != null && !isNaN(estimated1RM) && (
            <div className="px-3 py-2 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-xs text-muted-foreground">
                Best est. 1RM (Epley):{" "}
                <span className="font-semibold text-foreground">{estimated1RM} lbs/kg</span>
                <span className="ml-1 text-muted-foreground">— saved as your score</span>
              </p>
            </div>
          )}
        </div>
      ) : (
        <div>
          <label
            htmlFor="bestResultDisplay"
            className="block text-sm font-medium text-foreground mb-1"
          >
            Result
            {scoreType && (
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                {scoreType === "Time" && "— mm:ss or hh:mm:ss"}
                {scoreType === "Rounds + Reps" && "— rounds+reps (e.g. 5+2)"}
              </span>
            )}
          </label>
          <input
            id="bestResultDisplay"
            type="text"
            value={bestResultDisplay}
            onChange={(e) => setBestResultDisplay(e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg bg-background text-foreground ${
              displayError ? "border-red-400 dark:border-red-500" : "border-border"
            }`}
            placeholder={scoreType ? getResultPlaceholder(scoreType) : "e.g. 10:44, 5+2, 225"}
          />
          {displayError && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              {displayError}
            </p>
          )}
        </div>
      )}

      {!isLoadType && (
        <div>
          <label
            htmlFor="rxOrScaled"
            className="block text-sm font-medium text-foreground mb-1"
          >
            RX or Scaled
          </label>
          <select
            id="rxOrScaled"
            value={rxOrScaled}
            onChange={(e) => setRxOrScaled(e.target.value)}
            required
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
          >
            <option value="" disabled>
              Select RX or Scaled…
            </option>
            {RX_VALUES.map((o) => (
              <option key={o} value={o}>
                {o === "SCALED" ? "Scaled" : o}
              </option>
            ))}
          </select>
        </div>
      )}

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

      <div className="border-t border-border pt-3">
        <button
          type="button"
          onClick={() => setShowHealthMetrics((v) => !v)}
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          {showHealthMetrics ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
          Health &amp; performance data
          <span className="text-xs font-normal">(from your smartwatch)</span>
        </button>

        {showHealthMetrics && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="calories"
                className="block text-xs font-medium text-muted-foreground mb-1"
              >
                Calories burned
              </label>
              <input
                id="calories"
                type="number"
                inputMode="numeric"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm"
                placeholder="e.g. 420"
                min={0}
              />
            </div>
            <div>
              <label
                htmlFor="totalDuration"
                className="block text-xs font-medium text-muted-foreground mb-1"
              >
                Total time training (mm:ss)
              </label>
              <input
                id="totalDuration"
                type="text"
                value={totalDurationInput}
                onChange={(e) => setTotalDurationInput(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm"
                placeholder="e.g. 45:00"
              />
            </div>
            <div>
              <label
                htmlFor="avgHeartRate"
                className="block text-xs font-medium text-muted-foreground mb-1"
              >
                Avg HR (bpm)
              </label>
              <input
                id="avgHeartRate"
                type="number"
                inputMode="numeric"
                value={avgHeartRate}
                onChange={(e) => setAvgHeartRate(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm"
                placeholder="e.g. 155"
                min={0}
                max={250}
              />
            </div>
            <div>
              <label
                htmlFor="maxHeartRate"
                className="block text-xs font-medium text-muted-foreground mb-1"
              >
                Max HR (bpm)
              </label>
              <input
                id="maxHeartRate"
                type="number"
                inputMode="numeric"
                value={maxHeartRate}
                onChange={(e) => setMaxHeartRate(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm"
                placeholder="e.g. 182"
                min={0}
                max={250}
              />
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
