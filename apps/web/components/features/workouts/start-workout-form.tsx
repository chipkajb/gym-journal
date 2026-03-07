"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type TemplateOption = {
  id: string;
  name: string;
  category: string;
  exerciseCount: number;
};

type Props = {
  categories: string[];
  templates: TemplateOption[];
};

export function StartWorkoutForm({ categories, templates }: Props) {
  const router = useRouter();
  const [useTemplate, setUseTemplate] = useState(true);
  const [templateId, setTemplateId] = useState<string>(
    templates[0]?.id ?? ""
  );
  const [name, setName] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      let nameToUse = name.trim();
      let categoryToUse = category;
      if (useTemplate && templateId) {
        const t = templates.find((x) => x.id === templateId);
        if (t) {
          nameToUse = t.name;
          categoryToUse = t.category;
        }
      }
      if (!nameToUse) {
        setError("Enter a workout name or choose a template.");
        setLoading(false);
        return;
      }
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nameToUse,
          category: categoryToUse,
          templateId: useTemplate && templateId ? templateId : null,
        }),
      });
      if (!res.ok) {
        setError("Failed to start workout");
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
                {t.name} ({t.category}, {t.exerciseCount} exercises)
              </option>
            ))}
          </select>
        </div>
      )}

      {!useTemplate && (
        <>
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Workout name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="e.g. Morning run"
            />
          </div>
          <div>
            <label
              htmlFor="category"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Category
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      {useTemplate && templates.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No templates yet. Create one in the Library, or use a free workout.
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg"
      >
        {loading ? "Starting…" : "Start workout"}
      </button>
    </form>
  );
}
