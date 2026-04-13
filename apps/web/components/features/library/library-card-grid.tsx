"use client";

import { useMemo, useState } from "react";
import { LibraryTemplateCard } from "@/components/features/library/library-template-card";

type SessionLite = {
  id: string;
  workoutDate: string;
  bestResultDisplay: string | null;
  bestResultRaw: number | null;
  rxOrScaled: string | null;
  isPr: boolean;
  scoreType: string;
  notes: string | null;
};

type Template = {
  id: string;
  title: string;
  scoreType: string;
  sessions: SessionLite[];
};

export function LibraryCardGrid({ templates }: { templates: Template[] }) {
  const [titleFilter, setTitleFilter] = useState("");
  const [scoreTypeFilter, setScoreTypeFilter] = useState("");

  const scoreTypes = useMemo(() => {
    const set = new Set<string>();
    templates.forEach((t) => {
      if (t.scoreType) set.add(t.scoreType);
    });
    return Array.from(set).sort();
  }, [templates]);

  const filtered = useMemo(() => {
    return templates.filter((t) => {
      if (
        titleFilter &&
        !t.title.toLowerCase().includes(titleFilter.toLowerCase())
      ) {
        return false;
      }
      if (scoreTypeFilter && t.scoreType !== scoreTypeFilter) return false;
      return true;
    });
  }, [templates, titleFilter, scoreTypeFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Filter by title…"
          value={titleFilter}
          onChange={(e) => setTitleFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-w-[180px]"
        />
        <select
          value={scoreTypeFilter}
          onChange={(e) => setScoreTypeFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="">All score types</option>
          {scoreTypes.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center">
          No templates match the filters.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => (
            <li key={t.id}>
              <LibraryTemplateCard
                id={t.id}
                title={t.title}
                scoreType={t.scoreType}
                sessions={t.sessions}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
