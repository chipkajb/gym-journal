"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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
  const [workoutDate, setWorkoutDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [bestResultDisplay, setBestResultDisplay] = useState("");
  const [bestResultRaw, setBestResultRaw] = useState<string>("");
  const [scoreType, setScoreType] = useState("");
  const [barbellLift, setBarbellLift] = useState("");
  const [notes, setNotes] = useState("");
  const [rxOrScaled, setRxOrScaled] = useState("");
  const [isPr, setIsPr] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // when template changes or templateId from URL, prefill from template
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

  // sync URL templateId into state when navigating with ?templateId=
  useEffect(() => {
    if (templateIdFromUrl && templates.some((t) => t.id === templateIdFromUrl)) {
      setTemplateId(templateIdFromUrl);
      setUseTemplate(true);
    }
  }, [templateIdFromUrl, templates]);

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

      <div className="flex gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="mode"
            checked={useTemplate}
            onChange={() => setUseTemplate(true)}
            className="rounded-full"
          />
          <span className="text-gray-700 dark:text-gray-300">
            From template
          </span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="mode"
            checked={!useTemplate}
            onChange={() => setUseTemplate(false)}
            className="rounded-full"
          />
          <span className="text-gray-700 dark:text-gray-300">
            Free workout
          </span>
        </label>
      </div>

      {useTemplate && templates.length > 0 && (
        <div>
          <label
            htmlFor="template"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Template
          </label>
          <select
            id="template"
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
                {t.scoreType ? ` (${t.scoreType})` : ""}
              </option>
            ))}
          </select>
        </div>
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
          placeholder="e.g. DT, Linda"
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
          placeholder="e.g. 10:44, 5+2, 225"
        />
      </div>

      <div>
        <label
          htmlFor="bestResultRaw"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Result (raw, for sorting)
        </label>
        <input
          id="bestResultRaw"
          type="text"
          inputMode="decimal"
          value={bestResultRaw}
          onChange={(e) => setBestResultRaw(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          placeholder="e.g. 644 (seconds), 5.02 (rounds+reps), 225 (load)"
        />
      </div>

      <div>
        <label
          htmlFor="barbellLift"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Barbell lift (optional)
        </label>
        <input
          id="barbellLift"
          type="text"
          value={barbellLift}
          onChange={(e) => setBarbellLift(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          placeholder="e.g. Back Squat"
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
          placeholder="Workout notes"
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

      {useTemplate && templates.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No templates yet. Use a free workout or add templates from the Library.
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg"
      >
        {loading ? "Saving…" : "Log workout"}
      </button>
    </form>
  );
}
