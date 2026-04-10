"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { Save, Search, ExternalLink, CheckCircle, Trophy } from "lucide-react";

type Session = {
  id: string;
  title: string;
  workoutDate: string;
  bestResultDisplay: string | null;
  scoreType: string | null;
  rxOrScaled: string | null;
  isPr: boolean;
  notes: string | null;
};

type EditableFields = {
  notes: string;
  rxOrScaled: string;
};

export function SessionsEditor({ sessions }: { sessions: Session[] }) {
  // Track edits: map of session ID → changed fields
  const [edits, setEdits] = useState<Map<string, Partial<EditableFields>>>(
    new Map()
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterTitle, setFilterTitle] = useState("");

  const uniqueTitles = useMemo(() => {
    const seen = new Set<string>();
    return sessions
      .map((s) => s.title)
      .filter((t) => {
        if (seen.has(t)) return false;
        seen.add(t);
        return true;
      })
      .sort();
  }, [sessions]);

  const filtered = useMemo(() => {
    return sessions.filter((s) => {
      if (filterTitle && s.title !== filterTitle) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          s.title.toLowerCase().includes(q) ||
          (s.notes ?? "").toLowerCase().includes(q) ||
          (s.bestResultDisplay ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [sessions, filterTitle, search]);

  function getField(session: Session, field: keyof EditableFields): string {
    const edit = edits.get(session.id);
    if (edit && field in edit) return edit[field] ?? "";
    if (field === "notes") return session.notes ?? "";
    if (field === "rxOrScaled") return session.rxOrScaled ?? "";
    return "";
  }

  function setField(id: string, field: keyof EditableFields, value: string) {
    setSaved(false);
    setEdits((prev) => {
      const next = new Map(prev);
      const existing = next.get(id) ?? {};
      next.set(id, { ...existing, [field]: value });
      return next;
    });
  }

  const changedCount = edits.size;

  async function handleSave() {
    if (edits.size === 0) return;
    setSaving(true);
    setError(null);
    try {
      const updates = Array.from(edits.entries()).map(([id, fields]) => ({
        id,
        ...fields,
      }));
      const res = await fetch("/api/sessions/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(typeof data.error === "string" ? data.error : "Failed to save changes");
        return;
      }
      setEdits(new Map());
      setSaved(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search workouts…"
            className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        {/* Filter by workout title */}
        <select
          value={filterTitle}
          onChange={(e) => setFilterTitle(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
        >
          <option value="">All workouts</option>
          {uniqueTitles.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-2 ml-auto">
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle className="w-4 h-4" />
              Saved
            </span>
          )}
          {error && (
            <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={changedCount === 0 || saving}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving…" : `Save changes${changedCount > 0 ? ` (${changedCount})` : ""}`}
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        Showing {filtered.length} of {sessions.length} entries. Edit Notes or RX/Scaled inline, then save.
      </p>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-50 dark:bg-gray-700/80 text-left z-10">
              <tr>
                <th className="px-3 py-2.5 font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Date</th>
                <th className="px-3 py-2.5 font-medium text-gray-700 dark:text-gray-300">Workout</th>
                <th className="px-3 py-2.5 font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Result</th>
                <th className="px-3 py-2.5 font-medium text-gray-700 dark:text-gray-300 w-28">RX/Scaled</th>
                <th className="px-3 py-2.5 font-medium text-gray-700 dark:text-gray-300">Notes</th>
                <th className="px-3 py-2.5 font-medium text-gray-700 dark:text-gray-300 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    No sessions match your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((session) => {
                  const isDirty = edits.has(session.id);
                  return (
                    <tr
                      key={session.id}
                      className={`border-t border-gray-200 dark:border-gray-700 ${
                        isDirty ? "bg-amber-50/50 dark:bg-amber-950/10" : "hover:bg-gray-50 dark:hover:bg-gray-700/30"
                      }`}
                    >
                      {/* Date */}
                      <td className="px-3 py-2 text-gray-900 dark:text-white whitespace-nowrap align-top pt-3">
                        {format(parseISO(session.workoutDate), "MMM d, yyyy")}
                      </td>

                      {/* Workout title + badges */}
                      <td className="px-3 py-2 align-top pt-3">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {session.title}
                        </span>
                        {session.isPr && (
                          <Trophy className="inline w-3.5 h-3.5 text-amber-500 ml-1.5 mb-0.5" />
                        )}
                      </td>

                      {/* Result (read-only) */}
                      <td className="px-3 py-2 text-gray-600 dark:text-gray-300 whitespace-nowrap align-top pt-3">
                        {session.bestResultDisplay ?? "—"}
                      </td>

                      {/* RX/Scaled (editable) */}
                      <td className="px-3 py-2 align-top">
                        <select
                          value={getField(session, "rxOrScaled")}
                          onChange={(e) => setField(session.id, "rxOrScaled", e.target.value)}
                          className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="">—</option>
                          <option value="RX">RX</option>
                          <option value="Scaled">Scaled</option>
                        </select>
                      </td>

                      {/* Notes (editable textarea) */}
                      <td className="px-3 py-2 align-top min-w-[200px]">
                        <textarea
                          value={getField(session, "notes")}
                          onChange={(e) => setField(session.id, "notes", e.target.value)}
                          rows={2}
                          placeholder="Add notes…"
                          className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm resize-y focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-gray-400"
                        />
                      </td>

                      {/* Link to session */}
                      <td className="px-3 py-2 align-top pt-3">
                        <Link
                          href={`/workouts/${session.id}`}
                          title="View session"
                          className="text-gray-400 hover:text-primary transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sticky save bar when there are unsaved changes */}
      {changedCount > 0 && (
        <div className="fixed bottom-4 right-4 z-50">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground font-semibold rounded-xl shadow-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving…" : `Save ${changedCount} change${changedCount !== 1 ? "s" : ""}`}
          </button>
        </div>
      )}
    </div>
  );
}
