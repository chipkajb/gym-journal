"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WorkoutNameGenerator } from "@/components/features/workouts/workout-name-generator";
import { SCORE_TYPES, type ScoreType, isValidScoreType } from "@/lib/score-types";

type TemplateFormProps = {
  template?: {
    id: string;
    title: string;
    description: string | null;
    scoreType: string;
  };
};

export function TemplateForm({ template }: TemplateFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(template?.title ?? "");
  const [description, setDescription] = useState(template?.description ?? "");
  const [scoreType, setScoreType] = useState<ScoreType>(
    template?.scoreType && isValidScoreType(template.scoreType) ? template.scoreType : "Time"
  );
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
            scoreType,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          setError(typeof data.error === "string" ? data.error : (data.error?.title?.[0] ?? "Failed to update"));
          setLoading(false);
          return;
        }
        router.push("/training?tab=library");
        router.refresh();
      } else {
        const res = await fetch("/api/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim() || undefined,
            scoreType,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          setError(typeof data.error === "string" ? data.error : (data.error?.title?.[0] ?? "Failed to create"));
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
      className="rounded-xl border border-border bg-card p-6 space-y-4 max-w-lg"
    >
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded">
          {error}
        </p>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-foreground mb-1">Title</label>
        <input
          id="title" type="text" required value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground mb-2"
          placeholder="e.g. DT, Linda"
        />
        <WorkoutNameGenerator
          description={description || undefined}
          scoreType={scoreType || undefined}
          existingTitle={title || undefined}
          onSelect={(name) => setTitle(name)}
        />
      </div>

      <div>
        <label htmlFor="scoreType" className="block text-sm font-medium text-foreground mb-1">Score type</label>
        <select
          id="scoreType" value={scoreType} onChange={(e) => setScoreType(e.target.value as ScoreType)}
          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
          required
        >
          {SCORE_TYPES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-foreground mb-1">Description (optional)</label>
        <textarea
          id="description" rows={4} value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
          placeholder="Workout description / WOD details"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-semibold rounded-lg transition-colors"
      >
        {loading ? "Saving…" : isEdit ? "Save changes" : "Create template"}
      </button>
    </form>
  );
}
