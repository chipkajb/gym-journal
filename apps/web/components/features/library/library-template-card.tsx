"use client";

import { useState } from "react";
import Link from "next/link";
import { PenLine, History, ChevronDown, ChevronUp } from "lucide-react";
import { WorkoutHistoryPanel } from "@/components/features/workouts/workout-history-panel";
import type { HistorySession } from "@/components/features/workouts/workout-history-panel";

type Props = {
  id: string;
  title: string;
  scoreType: string;
  sessions: HistorySession[];
};

export function LibraryTemplateCard({ id, title, scoreType, sessions }: Props) {
  const [showHistory, setShowHistory] = useState(false);

  return (
    <div className="flex flex-col h-full p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <div className="flex-1">
        <h2 className="font-semibold text-gray-900 dark:text-white">{title}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{scoreType}</p>
        {sessions.length > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            {sessions.length} logged session{sessions.length !== 1 ? "s" : ""}
            {sessions[0]?.bestResultDisplay && ` · Last: ${sessions[0].bestResultDisplay}`}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mt-3">
        <Link
          href={`/library/templates/${id}/edit`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
        >
          <PenLine className="w-3.5 h-3.5" />
          Edit
        </Link>
        <Link
          href={`/workouts/new?templateId=${id}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm"
        >
          Log workout
        </Link>
        {sessions.length > 0 && (
          <button
            type="button"
            onClick={() => setShowHistory((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent text-sm transition-colors"
          >
            <History className="w-3.5 h-3.5" />
            History
            {showHistory ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>
        )}
      </div>

      {showHistory && sessions.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border">
          <WorkoutHistoryPanel sessions={sessions} initialLimit={5} />
        </div>
      )}
    </div>
  );
}
