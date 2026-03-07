"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";

type Session = {
  id: string;
  title: string;
  workoutDate: string;
  bestResultDisplay: string | null;
  scoreType: string | null;
  rxOrScaled: string | null;
  isPr: boolean;
};

type Props = { sessions: Session[] };

export function HistoryTableView({ sessions }: Props) {
  const [titleFilter, setTitleFilter] = useState("");
  const [scoreTypeFilter, setScoreTypeFilter] = useState("");
  const [rxFilter, setRxFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const scoreTypes = useMemo(() => {
    const set = new Set<string>();
    sessions.forEach((s) => {
      if (s.scoreType) set.add(s.scoreType);
    });
    return Array.from(set).sort();
  }, [sessions]);

  const filtered = useMemo(() => {
    return sessions.filter((s) => {
      if (
        titleFilter &&
        !s.title.toLowerCase().includes(titleFilter.toLowerCase())
      )
        return false;
      if (scoreTypeFilter && s.scoreType !== scoreTypeFilter) return false;
      if (rxFilter && s.rxOrScaled !== rxFilter) return false;
      const d = parseISO(s.workoutDate);
      if (dateFrom && d < new Date(dateFrom)) return false;
      if (dateTo) {
        const toEnd = new Date(dateTo);
        toEnd.setHours(23, 59, 59, 999);
        if (d > toEnd) return false;
      }
      return true;
    });
  }, [sessions, titleFilter, scoreTypeFilter, rxFilter, dateFrom, dateTo]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
            Title
          </label>
          <input
            type="text"
            placeholder="Filter by title…"
            value={titleFilter}
            onChange={(e) => setTitleFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-w-[160px]"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
            Score type
          </label>
          <select
            value={scoreTypeFilter}
            onChange={(e) => setScoreTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">All</option>
            {scoreTypes.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
            RX / Scaled
          </label>
          <select
            value={rxFilter}
            onChange={(e) => setRxFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">All</option>
            <option value="RX">RX</option>
            <option value="SCALED">SCALED</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
            From date
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
            To date
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">
                  Date
                </th>
                <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">
                  Workout
                </th>
                <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">
                  Result
                </th>
                <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">
                  Score type
                </th>
                <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">
                  RX/Scaled
                </th>
                <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">
                  PR
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    No workouts match the filters.
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {format(parseISO(s.workoutDate), "MMM d, yyyy")}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/workouts/${s.id}`}
                        className="font-medium text-gray-900 dark:text-white hover:underline"
                      >
                        {s.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {s.bestResultDisplay || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {s.scoreType || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {s.rxOrScaled || "—"}
                    </td>
                    <td className="px-4 py-3">
                      {s.isPr ? (
                        <span className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded">
                          PR
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Showing {filtered.length} of {sessions.length} workout
        {sessions.length !== 1 ? "s" : ""}.
      </p>
    </div>
  );
}
