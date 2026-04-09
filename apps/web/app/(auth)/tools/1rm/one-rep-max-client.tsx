"use client";

import { useState } from "react";
import { epleyOneRepMax, roundOneRepMax } from "@/lib/workout-utils";

const COMMON_LIFTS = [
  "Back Squat",
  "Front Squat",
  "Deadlift",
  "Clean",
  "Clean & Jerk",
  "Snatch",
  "Overhead Press",
  "Push Press",
  "Bench Press",
  "Thruster",
];

type Result = {
  lift: string;
  weight: number;
  reps: number;
  oneRepMax: number;
};

export function OneRepMaxClient() {
  const [lift, setLift] = useState("");
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("5");
  const [results, setResults] = useState<Result[]>([]);

  const w = parseFloat(weight);
  const r = parseInt(reps, 10);
  const preview =
    weight && reps && !isNaN(w) && !isNaN(r) && w > 0 && r > 0
      ? roundOneRepMax(epleyOneRepMax(w, r))
      : null;

  function handleCalculate() {
    if (!weight || !reps) return;
    if (isNaN(w) || isNaN(r) || w <= 0 || r <= 0) return;
    const oneRepMax = roundOneRepMax(epleyOneRepMax(w, r));
    const newResult: Result = {
      lift: lift.trim() || "Unnamed lift",
      weight: w,
      reps: r,
      oneRepMax,
    };
    setResults((prev) => [newResult, ...prev.slice(0, 19)]);
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Lift{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={lift}
              onChange={(e) => setLift(e.target.value)}
              className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              placeholder="e.g. Back Squat"
              list="common-lifts"
            />
            <datalist id="common-lifts">
              {COMMON_LIFTS.map((l) => (
                <option key={l} value={l} />
              ))}
            </datalist>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Weight (lbs/kg)
            </label>
            <input
              type="number"
              inputMode="decimal"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              placeholder="225"
              min={0}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Reps completed
            </label>
            <input
              type="number"
              inputMode="numeric"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              placeholder="5"
              min={1}
              max={30}
            />
          </div>
        </div>

        {preview != null && (
          <div className="px-4 py-3 rounded-lg bg-primary/5 border border-primary/20 text-center">
            <p className="text-xs text-muted-foreground mb-1">
              Estimated 1-Rep Max (Epley&apos;s formula)
            </p>
            <p className="text-3xl font-bold text-foreground">~{preview}</p>
            <p className="text-xs text-muted-foreground mt-1">lbs / kg</p>
          </div>
        )}

        <button
          type="button"
          onClick={handleCalculate}
          disabled={!weight || !reps || preview == null}
          className="w-full px-4 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-semibold rounded-lg transition-colors"
        >
          Save to history
        </button>
      </div>

      {/* Formula explanation */}
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground">Epley&apos;s Formula:</span>{" "}
          1RM = weight × (1 + reps ÷ 30). Best accuracy at 2–10 reps. For a true
          1-rep max, the result equals the weight itself.
        </p>
      </div>

      {/* History */}
      {results.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            This session
          </h2>
          <div className="space-y-2">
            {results.map((r, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/40"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{r.lift}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.weight} × {r.reps} reps
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-foreground">
                    ~{r.oneRepMax}
                  </p>
                  <p className="text-xs text-muted-foreground">est. 1RM</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
