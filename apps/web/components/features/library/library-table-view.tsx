"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PenLine } from "lucide-react";

type Template = {
  id: string;
  title: string;
  description: string | null;
  scoreType: string;
};

type Props = { templates: Template[] };

export function LibraryTableView({ templates }: Props) {
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
      )
        return false;
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

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">
                  Title
                </th>
                <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">
                  Score type
                </th>
                <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    No templates match the filters.
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">
                      {t.title}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {t.scoreType}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/library/templates/${t.id}/edit`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                        >
                          <PenLine className="w-3.5 h-3.5" />
                          Edit
                        </Link>
                        <Link
                          href={`/workouts/new?templateId=${t.id}`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm"
                        >
                          Log workout
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Showing {filtered.length} of {templates.length} template
        {templates.length !== 1 ? "s" : ""}.
      </p>
    </div>
  );
}
