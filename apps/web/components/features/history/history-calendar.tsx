"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  parseISO,
} from "date-fns";

const RX_SCALED_COLORS: Record<string, string> = {
  RX: "bg-amber-500",
  SCALED: "bg-blue-500",
};

type Session = {
  id: string;
  title: string;
  workoutDate: string;
  bestResultDisplay: string | null;
  scoreType: string | null;
  rxOrScaled: string | null;
};

type Props = { userId: string };

export function HistoryCalendar({ userId }: Props) {
  const [current, setCurrent] = useState(() => new Date());
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(current);
  const monthEnd = endOfMonth(current);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const from = calendarStart.toISOString();
  const to = calendarEnd.toISOString();

  // fetch sessions for the visible grid; abort if the user pages to another month first
  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    fetch(`/api/sessions?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, {
      signal: ctrl.signal,
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Session[]) => setSessions(Array.isArray(data) ? data : []))
      .catch(() => {
        if (!ctrl.signal.aborted) setSessions([]);
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    return () => ctrl.abort();
  }, [from, to]);

  const days: Date[] = [];
  let d = new Date(calendarStart);
  while (d <= calendarEnd) {
    days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }

  const sessionsByDay = useMemo(() => {
    const map = new Map<string, Session[]>();
    for (const s of sessions) {
      const day = format(parseISO(s.workoutDate), "yyyy-MM-dd");
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(s);
    }
    return map;
  }, [sessions]);

  const selectedSessions = selectedDate
    ? sessionsByDay.get(format(selectedDate, "yyyy-MM-dd")) ?? []
    : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setCurrent(subMonths(current, 1))}
          className="px-3 py-2 rounded-lg border border-input text-foreground hover:bg-accent"
        >
          Previous
        </button>
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-foreground">
            {format(current, "MMMM yyyy")}
          </h2>
          <button
            type="button"
            onClick={() => {
              setCurrent(new Date());
              setSelectedDate(null);
            }}
            className="px-2 py-1 text-xs rounded-lg border border-input text-muted-foreground hover:bg-accent transition-colors"
          >
            Reset
          </button>
        </div>
        <button
          type="button"
          onClick={() => setCurrent(addMonths(current, 1))}
          className="px-3 py-2 rounded-lg border border-input text-foreground hover:bg-accent"
        >
          Next
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-7 text-center text-sm font-medium text-muted-foreground border-b border-border">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="py-2">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 auto-rows-fr min-h-[280px]">
          {days.map((day) => {
            const dayKey = format(day, "yyyy-MM-dd");
            const daySessions = sessionsByDay.get(dayKey) ?? [];
            const isCurrentMonth = isSameMonth(day, current);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            return (
              <button
                key={dayKey}
                type="button"
                onClick={() => setSelectedDate(day)}
                className={`
                  min-h-[44px] p-1 border-b border-r border-border
                  ${isCurrentMonth ? "bg-card text-foreground" : "bg-muted text-muted-foreground"}
                  ${isSelected ? "ring-2 ring-primary ring-inset" : ""}
                  hover:bg-accent
                `}
              >
                <span className="text-sm">{format(day, "d")}</span>
                <div className="flex flex-wrap gap-0.5 mt-0.5 justify-center">
                  {daySessions.slice(0, 3).map((s) => (
                    <span
                      key={s.id}
                      className={`w-1.5 h-1.5 rounded-full ${RX_SCALED_COLORS[s.rxOrScaled ?? ""] ?? "bg-muted-foreground/40"}`}
                      title={s.title}
                    />
                  ))}
                  {daySessions.length > 3 && (
                    <span className="text-xs text-muted-foreground">
                      +{daySessions.length - 3}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {loading && (
        <p className="text-sm text-muted-foreground">
          Loading…
        </p>
      )}

      {selectedDate && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="font-medium text-foreground mb-2">
            {format(selectedDate, "EEEE, MMM d")}
          </h3>
          {selectedSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No workouts this day
            </p>
          ) : (
            <ul className="space-y-2">
              {selectedSessions.map((s) => (
                <li key={s.id} className="flex items-center gap-2 text-sm">
                  <span
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${RX_SCALED_COLORS[s.rxOrScaled ?? ""] ?? "bg-muted-foreground/40"}`}
                  />
                  <Link
                    href={`/workouts/${s.id}`}
                    className="text-foreground hover:underline"
                  >
                    {s.title}
                  </Link>
                  {s.bestResultDisplay && (
                    <span className="text-muted-foreground">
                      {s.bestResultDisplay}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-3 text-sm">
        {Object.entries(RX_SCALED_COLORS).map(([label, color]) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${color}`} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
