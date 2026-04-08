"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { WorkoutTimer, type TimerResult } from "./workout-timer";
import { WorkoutNameGenerator } from "./workout-name-generator";
import { Clock, ChevronDown, ChevronUp } from "lucide-react";

type TemplateOption = {
  id: string;
  title: string;
  description: string | null;
  scoreType: string | null;
  barbellLift: string | null;
};

type Props = {
  templates: TemplateOption[];
};

const SCORE_TYPES = ["", "Time", "Reps", "Load", "Rounds + Reps", "Rounds"];
const RX_OPTIONS = ["", "RX", "SCALED"];

export function LogWorkoutForm({ templates }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateIdFromUrl = searchParams.get("templateId");

  const [useTemplate, setUseTemplate] = useState(!!templateIdFromUrl);
  const [templateId, setTemplateId] = useState(templateIdFromUrl ?? templates[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [workoutDate, setWorkoutDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [bestResultDisplay, setBestResultDisplay] = useState("");
  const [bestResultRaw, setBestResultRaw] = useState<string>("");
  const [scoreType, setScoreType] = useState("");
  const [barbellLift, setBarbellLift] = useState("");
  const [notes, setNotes] = useState("");
  const [rxOrScaled, setRxOrScaled] = useState("");
  const [isPr, setIsPr] = useState(false);
  const [calories, setCalories] = useState("");
  const [maxHeartRate, setMaxHeartRate] = useState("");
  const [avgHeartRate, setAvgHeartRate] = useState("");
  const [totalDurationInput, setTotalDurationInput] = useState("");
  const [showHealthMetrics, setShowHealthMetrics] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [timedResult, setTimedResult] = useState<TimerResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (useTemplate && templateId) {
      const t = templates.find((x) => x.id === templateId);
      if (t) {
        setTitle(t.title);
        setDescription(t.description ?? "");
        setScoreType(t.scoreType ?? "");
        setBarbellLift(t.barbellLift ?? "");
      }
    }
  }, [useTemplate, templateId, templates]);

  useEffect(() => {
    if (templateIdFromUrl && templates.some((t) => t.id === templateIdFromUrl)) {
      setTemplateId(templateIdFromUrl);
      setUseTemplate(true);
    }
  }, [templateIdFromUrl, templates]);

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

  function handleTimerFinish(result: TimerResult) {
    setTimedResult(result);
    setShowTimer(false);
    if (scoreType === "Time" || !scoreType) {
      setBestResultDisplay(result.label);
      setBestResultRaw(String(result.durationSeconds));
      if (!scoreType) setScoreType("Time");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const titleToUse = title.trim();
      if (!titleToUse) {
        setError("Enter a workout title or choose a template.");
        setLoading(false);
        return;
      }
      const payload = {
        title: titleToUse,
        description: description.trim() || null,
        workoutDate: new Date(workoutDate).toISOString(),
        bestResultDisplay: bestResultDisplay.trim() || null,
        bestResultRaw: bestResultRaw === "" ? null : parseFloat(bestResultRaw),
        scoreType: scoreType || null,
        barbellLift: barbellLift.trim() || null,
        notes: notes.trim() || null,
        rxOrScaled: rxOrScaled || null,
        isPr,
        templateId: useTemplate && templateId ? templateId : null,
        calories: calories === "" ? null : parseInt(calories, 10),
        maxHeartRate: maxHeartRate === "" ? null : parseInt(maxHeartRate, 10),
        avgHeartRate: avgHeartRate === "" ? null : parseInt(avgHeartRate, 10),
        totalDurationSeconds: parseDurationInput(totalDurationInput),
        timedDurationSeconds: timedResult ? timedResult.durationSeconds : null,
      };
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error?.title?.[0] ?? "Failed to log workout");
        setLoading(false);
        return;
      }
      const data = await res.json();
      router.push(`/workouts/${data.id}`);
      router.refresh();
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  const currentTemplate = useTemplate ? templates.find((t) => t.id === templateId) : null;

  return (
    <div className="space-y-4 max-w-lg">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setShowTimer((v) => !v)}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border border-border hover:bg-accent text-foreground transition-colors"
        >
          <Clock className="w-4 h-4" />
          {showTimer ? "Hide timer" : "Open timer"}
        </button>
        {timedResult && !showTimer && (
          <span className="text-sm text-green-600 dark:text-green-400 font-medium">
            ✓ Timed: {timedResult.label}
          </span>
        )}
      </div>

      {showTimer && (
        <WorkoutTimer
          onFinish={handleTimerFinish}
          onDiscard={() => setShowTimer(false)}
        />
      )}

      <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-6 space-y-4">
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded">
            {error}
          </p>
        )}

        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="mode" checked={useTemplate} onChange={() => setUseTemplate(true)} />
            <span className="text-sm text-foreground">From template</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="mode" checked={!useTemplate} onChange={() => setUseTemplate(false)} />
            <span className="text-sm text-foreground">Free workout</span>
          </label>
        </div>

        {useTemplate && templates.length > 0 && (
          <div>
            <label htmlFor="template" className="block text-sm font-medium text-foreground mb-1">Template</label>
            <select
              id="template"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.title}{t.scoreType ? ` (${t.scoreType})` : ""}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-foreground mb-1">Workout title</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground mb-2"
            placeholder="e.g. DT, Linda, Fran"
          />
          <WorkoutNameGenerator
            description={description || currentTemplate?.description || undefined}
            scoreType={scoreType || currentTemplate?.scoreType || undefined}
            barbellLift={barbellLift || currentTemplate?.barbellLift || undefined}
            existingTitle={title || undefined}
            onSelect={(name) => setTitle(name)}
          />
        </div>

        <div>
          <label htmlFor="workoutDate" className="block text-sm font-medium text-foreground mb-1">Date</label>
          <input
            id="workoutDate"
            type="date"
            value={workoutDate}
            onChange={(e) => setWorkoutDate(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
          />
        </div>

        <div>
          <label htmlFor="scoreType" className="block text-sm font-medium text-foreground mb-1">Score type</label>
          <select
            id="scoreType"
            value={scoreType}
            onChange={(e) => setScoreType(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
          >
            {SCORE_TYPES.map((s) => (
              <option key={s || "none"} value={s}>{s || "—"}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="bestResultDisplay" className="block text-sm font-medium text-foreground mb-1">Result</label>
          <input
            id="bestResultDisplay"
            type="text"
            value={bestResultDisplay}
            onChange={(e) => setBestResultDisplay(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            placeholder={timedResult ? timedResult.label : "e.g. 10:44, 5+2, 225"}
          />
          {timedResult && (
            <button
              type="button"
              onClick={() => { setBestResultDisplay(timedResult.label); setBestResultRaw(String(timedResult.durationSeconds)); }}
              className="mt-1 text-xs text-primary hover:underline"
            >
              ← Use timed result: {timedResult.label}
            </button>
          )}
        </div>

        <div>
          <label htmlFor="bestResultRaw" className="block text-sm font-medium text-foreground mb-1">Result (raw, for sorting)</label>
          <input
            id="bestResultRaw"
            type="text"
            inputMode="decimal"
            value={bestResultRaw}
            onChange={(e) => setBestResultRaw(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            placeholder="e.g. 644 (seconds), 5.02 (rounds+reps), 225 (load)"
          />
        </div>

        <div>
          <label htmlFor="barbellLift" className="block text-sm font-medium text-foreground mb-1">Barbell lift (optional)</label>
          <input
            id="barbellLift"
            type="text"
            value={barbellLift}
            onChange={(e) => setBarbellLift(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            placeholder="e.g. Back Squat"
          />
        </div>

        <div>
          <label htmlFor="rxOrScaled" className="block text-sm font-medium text-foreground mb-1">RX or Scaled</label>
          <select
            id="rxOrScaled"
            value={rxOrScaled}
            onChange={(e) => setRxOrScaled(e.target.value)}
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
            id="notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            placeholder="How did it feel? Modifications? Strategy?"
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={isPr} onChange={(e) => setIsPr(e.target.checked)} className="rounded" />
          <span className="text-sm text-foreground">Personal record (PR)</span>
        </label>

        <div className="border-t border-border pt-3">
          <button
            type="button"
            onClick={() => setShowHealthMetrics((v) => !v)}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {showHealthMetrics ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            Health & performance data
            <span className="text-xs font-normal">(optional — from your smartwatch)</span>
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
            </div>
          )}
        </div>

        {useTemplate && templates.length === 0 && (
          <p className="text-sm text-muted-foreground">No templates yet. Use a free workout or add templates from the Library.</p>
        )}

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
