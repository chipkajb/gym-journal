"use client";

import { useState } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { Trophy, ChevronDown, ChevronUp } from "lucide-react";
import { roundOneRepMax } from "@/lib/workout-utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

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

function formatYAxisTick(value: number, scoreType: string | null): string {
  if (scoreType === "Time") {
    const m = Math.floor(value / 60);
    const s = Math.round(value % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  }
  return String(value);
}

type DotPayload = { isPr?: boolean };

function PrDot(props: { cx?: number; cy?: number; payload?: DotPayload }) {
  const { cx = 0, cy = 0, payload } = props;
  if (payload?.isPr) {
    return (
      <circle
        cx={cx}
        cy={cy}
        r={5}
        fill="rgb(245,158,11)"
        stroke="white"
        strokeWidth={2}
      />
    );
  }
  return <circle cx={cx} cy={cy} r={3} fill="rgb(59,130,246)" />;
}

function HistoryChart({ sessions }: { sessions: HistorySession[] }) {
  const chartData = [...sessions]
    .filter((s) => s.bestResultRaw != null)
    .reverse() // oldest → newest left to right
    .map((s) => ({
      date: format(parseISO(s.workoutDate), "MMM d"),
      fullDate: s.workoutDate,
      result: s.bestResultRaw as number,
      display: s.bestResultDisplay ?? String(s.bestResultRaw),
      isPr: s.isPr,
    }));

  if (chartData.length < 2) return null;

  const scoreType = sessions.find((s) => s.scoreType)?.scoreType ?? null;
  const isTime = scoreType === "Time";

  return (
    <div className="mb-4">
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10 }}
              className="text-muted-foreground"
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10 }}
              className="text-muted-foreground"
              width={42}
              tickFormatter={(v: number) => formatYAxisTick(v, scoreType)}
              reversed={isTime}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card)",
                color: "var(--foreground)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              formatter={(
                _value: number,
                _name: string,
                props: { payload?: { display?: string; isPr?: boolean } }
              ) => [
                props.payload?.isPr
                  ? `${props.payload.display} ★ PR`
                  : (props.payload?.display ?? String(_value)),
                "Result",
              ]}
              labelFormatter={(_, payload) =>
                payload?.[0]?.payload?.fullDate
                  ? format(parseISO(payload[0].payload.fullDate as string), "PPP")
                  : ""
              }
            />
            <Line
              type="monotone"
              dataKey="result"
              stroke="rgb(59,130,246)"
              strokeWidth={2}
              dot={<PrDot />}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-3">
        <span className="inline-flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400 border-2 border-white ring-1 ring-amber-400" />
          PR
        </span>
        {isTime && <span>Lower is better</span>}
      </p>
    </div>
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
            {/* Old records stored "225 x 5"; show computed 1RM. New records store 1RM directly. */}
            {session.scoreType === "Load" &&
              session.bestResultRaw != null &&
              /^\d+(?:\.\d+)?\s*x\s*\d+$/.test(session.bestResultDisplay) && (
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
          {expanded ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
        </button>
      )}
    </div>
  );

  return (
    <li className={`border-b border-border last:border-0 py-2 ${session.isPr ? "bg-amber-50/60 dark:bg-amber-900/10 rounded-lg" : ""}`}>
      {linkable ? (
        <Link
          href={`/workouts/${session.id}`}
          className="block hover:bg-accent/50 rounded px-1 -mx-1 transition-colors"
        >
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
      <p className="text-xs text-muted-foreground italic">
        No logged sessions yet.
      </p>
    );
  }

  const visible = showAll ? sessions : sessions.slice(0, initialLimit);
  const remaining = sessions.length - initialLimit;

  return (
    <div>
      <HistoryChart sessions={sessions} />
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
