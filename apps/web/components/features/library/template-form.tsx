"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const SCORE_TYPES = ["", "Time", "Reps", "Load", "Rounds + Reps", "Rounds"];

type TemplateFormProps = {
  template?: {
    id: string;
    title: string;
    description: string | null;
    scoreType: string | null;
    barbellLift: string | null;
  };
};

export function TemplateForm({ template }: TemplateFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(template?.title ?? "");
  const [description, setDescription] = useState(
    template?.description ?? ""
  );
  const [scoreType, setScoreType] = useState(template?.scoreType ?? "");
  const [barbellLift, setBarbellLift] = useState(template?.barbellLift ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isEdit = !!template;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isEdit) {
        const res = await fetch(`/api/templates/${template.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim() || null,
            scoreType: scoreType || null,
            barbellLift: barbellLift.trim() || null,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error?.title?.[0] ?? "Failed to update");
          setLoading(false);
          return;
        }
        router.push("/library");
        router.refresh();
      } else {
        const res = await fetch("/api/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim() || undefined,
            scoreType: scoreType || null,
            barbellLift: barbellLift.trim() || null,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error?.title?.[0] ?? "Failed to create");
          setLoading(false);
          return;
        }
        const data = await res.json();
        router.push(`/library/templates/${data.id}/edit`);
        router.refresh();
      }
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
          Title
        </label>
        <input
          id="title"
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          placeholder="e.g. DT, Linda"
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
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Description (optional)
        </label>
        <textarea
          id="description"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          placeholder="Workout description / WOD details"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg"
      >
        {loading ? "Saving…" : isEdit ? "Save changes" : "Create template"}
      </button>
    </form>
  );
}
