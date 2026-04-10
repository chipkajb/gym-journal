"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Trophy, ChevronDown, ChevronUp } from "lucide-react";
import { roundOneRepMax } from "@/lib/workout-utils";

export type HistorySession = {
  id: string;
  workoutDate: string;
  bestResultDisplay: string | null;
  bestResultRaw: number | null;
  rxOrScaled: string | null;
  isPr: boolean;
  scoreType: string | null;
  notes: string | null;
};

type Props = {
  sessions: HistorySession[];
  /** If true, wrap each row in a link to the session detail page */
  linkable?: boolean;
  /** Max rows to show before a "show more" control */
  initialLimit?: number;
};

function OneRepMaxBadge({ session }: { session: HistorySession }) {
  if (session.scoreType !== "Load" || session.bestResultRaw == null) return null;
  return (
    <span className="text-xs text-muted-foreground">
      Est. 1RM: {roundOneRepMax(session.bestResultRaw)} lbs
    </span>
  );
}

function SessionRow({
  session,
  linkable,
}: {
  session: HistorySession;
  linkable: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  const dateLabel = format(new Date(session.workoutDate), "MMM d, yyyy");

  const content = (
    <div className="flex items-start justify-between gap-2 w-full">
      <div className="min-w-0">
        <div className="flex items-center flex-wrap gap-1.5">
          <span className="text-sm font-medium text-foreground">{dateLabel}</span>
          {session.isPr && (
            <span className="inline-flex items-center gap-0.5 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded">
              <Trophy className="w-3 h-3" />
              PR
            </span>
          )}
          {session.rxOrScaled && (
            <span
              className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                session.rxOrScaled === "RX"
                  ? "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30"
                  : "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30"
              }`}
            >
              {session.rxOrScaled}
            </span>
          )}
        </div>
        {session.bestResultDisplay && (
          <p className="text-sm text-foreground font-semibold mt-0.5">
            {session.bestResultDisplay}
            {session.scoreType === "Load" && session.bestResultRaw != null && (
              <span className="ml-2 font-normal text-muted-foreground text-xs">
                (Est. 1RM: {roundOneRepMax(session.bestResultRaw)})
              </span>
            )}
          </p>
        )}
      </div>
      {session.notes && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setExpanded((v) => !v);
          }}
          className="shrink-0 text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5 mt-0.5"
        >
          Notes
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      )}
    </div>
  );

  return (
    <li className="border-b border-border last:border-0 py-2">
      {linkable ? (
        <Link href={`/workouts/${session.id}`} className="block hover:bg-accent/50 rounded px-1 -mx-1 transition-colors">
          {content}
        </Link>
      ) : (
        <div className="px-1 -mx-1">{content}</div>
      )}
      {expanded && session.notes && (
        <p className="mt-1.5 ml-1 text-xs text-muted-foreground whitespace-pre-wrap bg-muted/40 rounded p-2">
          {session.notes}
        </p>
      )}
    </li>
  );
}

export function WorkoutHistoryPanel({
  sessions,
  linkable = true,
  initialLimit = 5,
}: Props) {
  const [showAll, setShowAll] = useState(false);

  if (sessions.length === 0) {
    return (
      <p className="text-xs text-muted-foreground italic">No logged sessions yet.</p>
    );
  }

  const visible = showAll ? sessions : sessions.slice(0, initialLimit);
  const remaining = sessions.length - initialLimit;

  return (
    <div>
      <ul className="divide-y divide-border">
        {visible.map((s) => (
          <SessionRow key={s.id} session={s} linkable={linkable} />
        ))}
      </ul>
      {!showAll && remaining > 0 && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="mt-2 text-xs text-primary hover:text-primary/80 font-medium"
        >
          Show {remaining} more
        </button>
      )}
    </div>
  );
}
