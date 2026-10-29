"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { WorkoutTimer, type TimerResult } from "./workout-timer";
import { WorkoutHistoryPanel, type HistorySession } from "./workout-history-panel";
import { Clock, History } from "lucide-react";
import {
  displayToRaw,
  validateDisplayResult,
  bestOneRmFromLoadSetDetails,
  formatLoadSetsForNotes,
  parseValidLoadSets,
  validateLoadSetRows,
} from "@/lib/workout-utils";
import { SCORE_TYPES, type ScoreType, isValidScoreType } from "@/lib/score-types";
import { localCalendarYmd } from "@/lib/calendar-date";
import { parseDurationInput } from "@/lib/duration";
import { SearchSelect } from "@/components/ui/search-select";
import { HealthMetricsFields, ScoreFields, type LoadSetRow } from "@/components/features/workouts/workout-form-fields";

type TemplateOption = {
  id: string;
  title: string;
  description: string | null;
  scoreType: string;
};

type Props = {
  templates: TemplateOption[];
};



// ---------------------------------------------------------------------------
// Searchable template combobox
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Main form
// ---------------------------------------------------------------------------
export function LogWorkoutForm({ templates }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateIdFromUrl = searchParams.get("templateId");

  const [useTemplate, setUseTemplate] = useState(!!templateIdFromUrl);
  const [templateId, setTemplateId] = useState(
    templateIdFromUrl ?? templates[0]?.id ?? ""
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [workoutDate, setWorkoutDate] = useState(() => localCalendarYmd());
  // Display result (what the user types)
  const [bestResultDisplay, setBestResultDisplay] = useState("");
  const [loadSets, setLoadSets] = useState<LoadSetRow[]>([{ weight: "", reps: "" }]);

  const [scoreType, setScoreType] = useState<ScoreType>("Time");
  const [notes, setNotes] = useState("");
  const [rxOrScaled, setRxOrScaled] = useState("");
  const [calories, setCalories] = useState("");
  const [maxHeartRate, setMaxHeartRate] = useState("");
  const [avgHeartRate, setAvgHeartRate] = useState("");
  const [totalDurationInput, setTotalDurationInput] = useState("");
  const [showHealthMetrics, setShowHealthMetrics] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<HistorySession[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isLoadType = scoreType === "Load";
  const templateOptions = useMemo(
    () => templates.map((t) => ({ value: t.id, label: t.title, hint: t.scoreType ?? undefined })),
    [templates]
  );

  // Auto-fill title/description/scoreType when template changes
  useEffect(() => {
    if (useTemplate && templateId) {
      const t = templates.find((x) => x.id === templateId);
      if (t) {
        setTitle(t.title);
        setDescription(t.description ?? "");
        setScoreType(isValidScoreType(t.scoreType) ? t.scoreType : "Time");
        setLoadSets([{ weight: "", reps: "" }]);
      }
    }
  }, [useTemplate, templateId, templates]);

  // Pre-select template from URL param
  useEffect(() => {
    if (templateIdFromUrl && templates.some((t) => t.id === templateIdFromUrl)) {
      setTemplateId(templateIdFromUrl);
      setUseTemplate(true);
    }
  }, [templateIdFromUrl, templates]);

  // Fetch history when template is selected
  const fetchHistory = useCallback(async (tid: string) => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/sessions?templateId=${tid}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data as HistorySession[]);
      }
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (useTemplate && templateId) {
      fetchHistory(templateId);
    } else {
      setHistory([]);
    }
  }, [useTemplate, templateId, fetchHistory]);

  const displayError =
    scoreType && bestResultDisplay ? validateDisplayResult(bestResultDisplay, scoreType) : null;

  useEffect(() => {
    if (!isLoadType) return;
    const sets = parseValidLoadSets(loadSets);
    const best = sets.length ? bestOneRmFromLoadSetDetails({ sets }) : null;
    setBestResultDisplay(best != null ? String(best) : "");
  }, [isLoadType, loadSets]);

  function handleTimerFinish(result: TimerResult) {
    setShowTimer(false);
    if (scoreType === "Time") {
      setBestResultDisplay(result.label);
    }
    if (result.roundsNote) {
      setNotes((prev) =>
        prev.trim() ? `${prev.trim()}\n\n${result.roundsNote}` : result.roundsNote!
      );
    }
  }

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const titleToUse = title.trim();
    if (!titleToUse) {
      setError("Enter a workout title or choose a template.");
      return;
    }
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
      if (scoreType) {
        const err = validateDisplayResult(bestResultDisplay, scoreType);
        if (err) {
          setError(`Result: ${err}`);
          return;
        }
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

      const payload = {
        title: titleToUse,
        description: description.trim() || null,
        workoutDate,
        bestResultDisplay: bestResultDisplay.trim() || null,
        bestResultRaw,
        scoreType,
        setDetails: loadSetDetails,
        notes: mergedNotes,
        rxOrScaled: isLoadType ? null : rxOrScaled,
        templateId: useTemplate && templateId ? templateId : null,
        calories: calories === "" ? null : parseInt(calories, 10),
        maxHeartRate: maxHeartRate === "" ? null : parseInt(maxHeartRate, 10),
        avgHeartRate: avgHeartRate === "" ? null : parseInt(avgHeartRate, 10),
        totalDurationSeconds: parseDurationInput(totalDurationInput),
      };
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const raw = await res.json();
      if (!res.ok) {
        const fe = raw.error;
        let msg = "Failed to log workout";
        if (typeof fe === "string") msg = fe;
        else if (fe && typeof fe === "object") {
          const parts = Object.values(fe)
            .flat()
            .filter((x): x is string => typeof x === "string");
          if (parts.length) msg = parts.join(" ");
        }
        setError(msg);
        setLoading(false);
        return;
      }
      const celebrate = raw.celebratePr === true;
      router.push(`/workouts/${raw.id}${celebrate ? "?celebrate=pr" : ""}`);
      router.refresh();
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  const currentTemplate = useTemplate ? templates.find((t) => t.id === templateId) : null;

  // Estimated 1RM for Load type
  const estimated1RM =
    isLoadType && bestResultDisplay.trim()
      ? parseFloat(bestResultDisplay)
      : null;

  const healthSetters = {
    calories: setCalories,
    totalDuration: setTotalDurationInput,
    avgHeartRate: setAvgHeartRate,
    maxHeartRate: setMaxHeartRate,
  };

  return (
    <div className="space-y-4 max-w-lg">
      {!isLoadType && (
        <>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowTimer((v) => !v)}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border border-border hover:bg-accent text-foreground transition-colors"
            >
              <Clock className="w-4 h-4" />
              {showTimer ? "Hide timer" : "Open timer"}
            </button>
          </div>

          {showTimer && (
            <WorkoutTimer
              onFinish={handleTimerFinish}
              onDiscard={() => setShowTimer(false)}
            />
          )}
        </>
      )}

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-border bg-card p-6 space-y-4"
      >
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded">
            {error}
          </p>
        )}

        {/* Mode toggle */}
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="mode"
              checked={useTemplate}
              onChange={() => setUseTemplate(true)}
            />
            <span className="text-sm text-foreground">From template</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="mode"
              checked={!useTemplate}
              onChange={() => {
                setUseTemplate(false);
                setScoreType("Time");
                setLoadSets([{ weight: "", reps: "" }]);
              }}
            />
            <span className="text-sm text-foreground">Free workout</span>
          </label>
        </div>

        {/* Searchable template selector */}
        {useTemplate && templates.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Template
            </label>
            <SearchSelect
              options={templateOptions}
              value={templateId}
              onChange={setTemplateId}
              placeholder="Select template…"
              searchPlaceholder="Search workouts…"
            />

            {/* Inline history toggle */}
            {templateId && (
              <button
                type="button"
                onClick={() => setShowHistory((v) => !v)}
                className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <History className="w-3.5 h-3.5" />
                {showHistory ? "Hide history" : "View history"}
                {history.length > 0 && (
                  <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
                    {history.length}
                  </span>
                )}
              </button>
            )}

            {showHistory && (
              <div className="mt-2 p-3 rounded-lg bg-muted/40 border border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Your history
                </p>
                {historyLoading ? (
                  <p className="text-xs text-muted-foreground">Loading…</p>
                ) : (
                  <WorkoutHistoryPanel sessions={history} initialLimit={5} />
                )}
              </div>
            )}
          </div>
        )}

        {useTemplate && templates.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No templates yet. Use a free workout or add templates from the Library.
          </p>
        )}

        {/* Workout title */}
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
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            placeholder="e.g. DT, Linda, Fran"
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
            placeholder="Movements, stimulus, equipment — whatever defines this session."
          />
        </div>

        {/* Date */}
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

        {/* Score type */}
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

        {/* Notes */}
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
            placeholder="How did it feel? Modifications? Strategy?"
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
          {loading ? "Saving…" : "Log workout"}
        </button>
      </form>
    </div>
  );
}
