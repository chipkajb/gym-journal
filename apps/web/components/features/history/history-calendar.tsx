"use client";

import { useState, useMemo, useEffect } from "react";
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

const CATEGORY_COLORS: Record<string, string> = {
  Strength: "bg-blue-500",
  Cardio: "bg-green-500",
  CrossFit: "bg-amber-500",
  Flexibility: "bg-purple-500",
};

type Session = {
  id: string;
  name: string;
  category: string;
  startedAt: string;
  completedAt: string | null;
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

  // fetch sessions for current month
  useEffect(() => {
    setLoading(true);
    const from = calendarStart.toISOString();
    const to = calendarEnd.toISOString();
    fetch(
      `/api/sessions?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
    )
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Session[]) => setSessions(Array.isArray(data) ? data : []))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, [calendarStart.getTime(), calendarEnd.getTime()]);

  const days: Date[] = [];
  let d = new Date(calendarStart);
  while (d <= calendarEnd) {
    days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }

  const sessionsByDay = useMemo(() => {
    const map = new Map<string, Session[]>();
    for (const s of sessions) {
      const day = format(parseISO(s.startedAt), "yyyy-MM-dd");
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
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCurrent(subMonths(current, 1))}
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          Previous
        </button>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {format(current, "MMMM yyyy")}
        </h2>
        <button
          type="button"
          onClick={() => setCurrent(addMonths(current, 1))}
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          Next
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
        <div className="grid grid-cols-7 text-center text-sm font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
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
                  min-h-[44px] p-1 border-b border-r border-gray-100 dark:border-gray-700
                  ${isCurrentMonth ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white" : "bg-gray-50 dark:bg-gray-800/50 text-gray-400"}
                  ${isSelected ? "ring-2 ring-blue-500 ring-inset" : ""}
                  hover:bg-gray-50 dark:hover:bg-gray-700
                `}
              >
                <span className="text-sm">{format(day, "d")}</span>
                <div className="flex flex-wrap gap-0.5 mt-0.5 justify-center">
                  {daySessions.slice(0, 3).map((s) => (
                    <span
                      key={s.id}
                      className={`w-1.5 h-1.5 rounded-full ${CATEGORY_COLORS[s.category] ?? "bg-gray-400"}`}
                      title={s.name}
                    />
                  ))}
                  {daySessions.length > 3 && (
                    <span className="text-xs text-gray-400">
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
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Loading…
        </p>
      )}

      {selectedDate && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <h3 className="font-medium text-gray-900 dark:text-white mb-2">
            {format(selectedDate, "EEEE, MMM d")}
          </h3>
          {selectedSessions.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No workouts this day
            </p>
          ) : (
            <ul className="space-y-2">
              {selectedSessions.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center gap-2 text-sm"
                >
                  <span
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${CATEGORY_COLORS[s.category] ?? "bg-gray-400"}`}
                  />
                  <span className="text-gray-900 dark:text-white">
                    {s.name}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {format(parseISO(s.startedAt), "h:mm a")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-3 text-sm">
        {Object.entries(CATEGORY_COLORS).map(([label, color]) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${color}`} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
