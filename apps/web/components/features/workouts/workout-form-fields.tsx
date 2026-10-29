"use client";

import type { Dispatch, SetStateAction } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { getResultPlaceholder } from "@/lib/workout-utils";

/** Form sections shared by the log and edit workout forms. */

export const RX_VALUES = ["RX", "SCALED"] as const;

export type LoadSetRow = { weight: string; reps: string };

export type HealthMetricsValues = {
  calories: string;
  totalDuration: string;
  avgHeartRate: string;
  maxHeartRate: string;
};

const inputClass =
  "w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground";

export function ScoreFields({
  scoreType,
  loadSets,
  setLoadSets,
  estimated1RM,
  bestResultDisplay,
  setBestResultDisplay,
  displayError,
  rxOrScaled,
  setRxOrScaled,
}: {
  scoreType: string;
  loadSets: LoadSetRow[];
  setLoadSets: Dispatch<SetStateAction<LoadSetRow[]>>;
  estimated1RM: number | null;
  bestResultDisplay: string;
  setBestResultDisplay: (v: string) => void;
  displayError: string | null;
  rxOrScaled: string;
  setRxOrScaled: (v: string) => void;
}) {
  if (scoreType === "Load") {
    const updateRow = (idx: number, patch: Partial<LoadSetRow>) =>
      setLoadSets((rows) => rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)));

    return (
      <div className="space-y-3">
        <span className="block text-sm font-medium text-foreground">Sets</span>
        <p className="text-xs text-muted-foreground">
          Add each set below. Your best estimated 1RM (Epley) across sets is saved as the score;
          sets are copied into Notes when you save.
        </p>
        {loadSets.map((row, idx) => (
          <div key={idx} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
            <label className="block">
              <span className="block text-xs text-muted-foreground mb-1">Weight</span>
              <input
                type="number"
                inputMode="decimal"
                value={row.weight}
                onChange={(e) => updateRow(idx, { weight: e.target.value })}
                className={inputClass}
                placeholder="225"
                min={0}
              />
            </label>
            <label className="block">
              <span className="block text-xs text-muted-foreground mb-1">Reps</span>
              <input
                type="number"
                inputMode="numeric"
                value={row.reps}
                onChange={(e) => updateRow(idx, { reps: e.target.value })}
                className={inputClass}
                placeholder="5"
                min={1}
              />
            </label>
            {loadSets.length > 1 && (
              <button
                type="button"
                onClick={() => setLoadSets((rows) => rows.filter((_, i) => i !== idx))}
                aria-label={`Remove set ${idx + 1}`}
                className="px-2 py-2 text-xs text-muted-foreground hover:text-destructive border border-border rounded-lg"
              >
                Remove
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => setLoadSets((rows) => [...rows, { weight: "", reps: "" }])}
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
    );
  }

  return (
    <>
      <div>
        <label htmlFor="bestResultDisplay" className="block text-sm font-medium text-foreground mb-1">
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
          aria-invalid={!!displayError}
          aria-describedby={displayError ? "bestResultDisplay-error" : undefined}
          className={`${inputClass} ${displayError ? "border-red-400 dark:border-red-500" : ""}`}
          placeholder={scoreType ? getResultPlaceholder(scoreType) : "e.g. 10:44, 5+2, 225"}
        />
        {displayError && (
          <p id="bestResultDisplay-error" className="mt-1 text-xs text-red-600 dark:text-red-400">
            {displayError}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="rxOrScaled" className="block text-sm font-medium text-foreground mb-1">
          RX or Scaled <span className="text-red-500">*</span>
        </label>
        <select
          id="rxOrScaled"
          value={rxOrScaled}
          onChange={(e) => setRxOrScaled(e.target.value)}
          required
          className={inputClass}
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
    </>
  );
}

const HEALTH_FIELDS: {
  key: keyof HealthMetricsValues;
  label: string;
  placeholder: string;
  numeric: boolean;
  max?: number;
}[] = [
  { key: "calories", label: "Calories burned", placeholder: "e.g. 420", numeric: true },
  { key: "totalDuration", label: "Total time training (mm:ss)", placeholder: "e.g. 45:00", numeric: false },
  { key: "avgHeartRate", label: "Avg HR (bpm)", placeholder: "e.g. 155", numeric: true, max: 250 },
  { key: "maxHeartRate", label: "Max HR (bpm)", placeholder: "e.g. 182", numeric: true, max: 250 },
];

export function HealthMetricsFields({
  open,
  onToggle,
  values,
  onChange,
}: {
  open: boolean;
  onToggle: () => void;
  values: HealthMetricsValues;
  onChange: (key: keyof HealthMetricsValues, value: string) => void;
}) {
  return (
    <div className="border-t border-border pt-3">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        Health &amp; performance data
        <span className="text-xs font-normal">(optional — from your smartwatch)</span>
      </button>

      {open && (
        <div className="mt-3 grid grid-cols-2 gap-3">
          {HEALTH_FIELDS.map((f) => (
            <div key={f.key}>
              <label htmlFor={f.key} className="block text-xs font-medium text-muted-foreground mb-1">
                {f.label}
              </label>
              <input
                id={f.key}
                type={f.numeric ? "number" : "text"}
                inputMode={f.numeric ? "numeric" : undefined}
                value={values[f.key]}
                onChange={(e) => onChange(f.key, e.target.value)}
                className={`${inputClass} text-sm`}
                placeholder={f.placeholder}
                min={f.numeric ? 0 : undefined}
                max={f.max}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
