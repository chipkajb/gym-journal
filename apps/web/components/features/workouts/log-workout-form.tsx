"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { WorkoutTimer, type TimerResult } from "./workout-timer";
import { WorkoutHistoryPanel, type HistorySession } from "./workout-history-panel";
import {
  Clock,
  ChevronDown,
  ChevronUp,
  Search,
  History,
} from "lucide-react";
import {
  displayToRaw,
  validateDisplayResult,
  getResultPlaceholder,
  bestOneRmFromLoadSetDetails,
  formatLoadSetsForNotes,
} from "@/lib/workout-utils";
import { SCORE_TYPES, type ScoreType, isValidScoreType } from "@/lib/score-types";

type TemplateOption = {
  id: string;
  title: string;
  description: string | null;
  scoreType: string;
};

type Props = {
  templates: TemplateOption[];
};

const RX_VALUES = ["RX", "SCALED"] as const;

type LoadSetRow = { weight: string; reps: string };

// ---------------------------------------------------------------------------
// Searchable template combobox
// ---------------------------------------------------------------------------
function TemplateCombobox({
  templates,
  value,
  onChange,
}: {
  templates: TemplateOption[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selected = templates.find((t) => t.id === value);

  const filtered = query.trim()
    ? templates.filter((t) =>
        t.title.toLowerCase().includes(query.toLowerCase())
      )
    : templates;

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function select(id: string) {
    onChange(id);
    setOpen(false);
    setQuery("");
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-left flex items-center justify-between gap-2 text-sm"
      >
        <span className="truncate">
          {selected
            ? `${selected.title}${selected.scoreType ? ` (${selected.scoreType})` : ""}`
            : "Select template…"}
        </span>
        <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-card border border-border rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search workouts…"
                className="w-full pl-7 pr-3 py-1.5 text-sm bg-background border border-border rounded text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
          <ul className="max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-muted-foreground">No matches</li>
            ) : (
              filtered.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => select(t.id)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors ${
                      t.id === value ? "bg-primary/10 text-primary font-medium" : "text-foreground"
                    }`}
                  >
                    <span className="block font-medium">{t.title}</span>
                    <span className="text-xs text-muted-foreground">{t.scoreType}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

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
  const [workoutDate, setWorkoutDate] = useState(
    () => new Date().toISOString().slice(0, 10)
  );
  // Display result (what the user types)
  const [bestResultDisplay, setBestResultDisplay] = useState("");
  const [loadSets, setLoadSets] = useState<LoadSetRow[]>([{ weight: "", reps: "1" }]);

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
  const [displayError, setDisplayError] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isLoadType = scoreType === "Load";

  // Auto-fill title/description/scoreType when template changes
  useEffect(() => {
    if (useTemplate && templateId) {
      const t = templates.find((x) => x.id === templateId);
      if (t) {
        setTitle(t.title);
        setDescription(t.description ?? "");
        setScoreType(isValidScoreType(t.scoreType) ? t.scoreType : "Time");
        setLoadSets([{ weight: "", reps: "1" }]);
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

  // Validate display result whenever it or scoreType changes
  useEffect(() => {
    if (scoreType && bestResultDisplay) {
      setDisplayError(validateDisplayResult(bestResultDisplay, scoreType));
    } else {
      setDisplayError(null);
    }
  }, [bestResultDisplay, scoreType]);

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
    if (!notes.trim()) {
      setError("Notes are required.");
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

      const payload = {
        title: titleToUse,
        description: description.trim() || null,
        workoutDate: new Date(workoutDate).toISOString(),
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
      router.push(`/workouts/${raw.id}`);
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
                setLoadSets([{ weight: "", reps: "1" }]);
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
            <TemplateCombobox
              templates={templates}
              value={templateId}
              onChange={setTemplateId}
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
            <p className="text-xs text-muted-foreground">
              Add each set below. Your best estimated 1RM (Epley) across sets is saved as the score;
              sets are copied into Notes when you log.
            </p>
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
          /* Non-load result */
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
              RX or Scaled <span className="text-red-500">*</span>
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

        {/* Notes */}
        <div>
          <label
            htmlFor="notes"
            className="block text-sm font-medium text-foreground mb-1"
          >
            Notes <span className="text-red-500">*</span>
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

        {/* Health metrics */}
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
            <span className="text-xs font-normal">
              (optional — from your smartwatch)
            </span>
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
            </div>
          )}
        </div>

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
