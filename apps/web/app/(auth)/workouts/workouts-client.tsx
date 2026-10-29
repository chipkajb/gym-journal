"use client";

import { useState, useMemo, type ElementType } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { formatWorkoutCalendarDate } from "@/lib/calendar-date";
import { Plus, Dumbbell, Search, List, Calendar, Table, Pencil } from "lucide-react";
import { HistoryCalendar } from "@/components/features/history/history-calendar";
import { HistoryTableView } from "@/components/features/history/history-table-view";

type Session = {
  id: string;
  title: string;
  workoutDate: string;
  bestResultDisplay: string | null;
  scoreType: string | null;
  rxOrScaled: string | null;
  isPr: boolean;
};

type Props = {
  sessions: Session[];
  userId: string;
  /** When embedded in `/training`, list/calendar/table URLs use this base (default `/workouts`). */
  urlBasePath?: string;
  headingLevel?: "page" | "section";
};

type Tab = "list" | "calendar" | "table";

const TABS: { id: Tab; label: string; icon: ElementType }[] = [
  { id: "list", label: "List", icon: List },
  { id: "calendar", label: "Calendar", icon: Calendar },
  { id: "table", label: "Table", icon: Table },
];

export function WorkoutsPageClient({
  sessions,
  userId,
  urlBasePath = "/workouts",
  headingLevel = "page",
}: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const rawTab = searchParams.get("view") as Tab | null;
  const activeTab: Tab =
    rawTab === "calendar" || rawTab === "table" ? rawTab : "list";

  const [search, setSearch] = useState("");

  const filteredSessions = useMemo(() => {
    if (!search.trim()) return sessions;
    const q = search.toLowerCase();
    return sessions.filter((s) => s.title.toLowerCase().includes(q));
  }, [sessions, search]);

  function switchTab(tab: Tab) {
    const params = new URLSearchParams(searchParams.toString());
    if (urlBasePath === "/training") {
      params.set("tab", "sessions");
    }
    if (tab === "list") params.delete("view");
    else params.set("view", tab);
    const qs = params.toString();
    router.push(`${urlBasePath}${qs ? `?${qs}` : ""}`);
  }

  const HeadingTag = headingLevel === "section" ? "h2" : "h1";
  const titleClass =
    headingLevel === "section"
      ? "text-xl font-bold text-foreground"
      : "text-2xl font-bold text-foreground";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <HeadingTag className={titleClass}>Workouts</HeadingTag>
        <Link
          href="/workouts/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          Log workout
        </Link>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-border">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => switchTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-input"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* List tab */}
      {activeTab === "list" && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search workouts…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {sessions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-input p-12 text-center">
              <Dumbbell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                No workouts yet. Log your first session or import from CSV.
              </p>
              <Link
                href="/workouts/new"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90"
              >
                <Plus className="w-4 h-4" />
                Log workout
              </Link>
            </div>
          ) : filteredSessions.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">
              No workouts match &ldquo;{search}&rdquo;.
            </p>
          ) : (
            <>
              <ul className="space-y-2">
                {filteredSessions.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/workouts/${s.id}`}
                      className="block p-4 rounded-xl bg-card border border-border hover:border-primary  transition-colors"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <p className="font-semibold text-foreground">
                            {s.title}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatWorkoutCalendarDate(s.workoutDate, "short")}
                            {s.bestResultDisplay && (
                              <> · {s.bestResultDisplay}</>
                            )}
                            {s.rxOrScaled && <> · {s.rxOrScaled}</>}
                          </p>
                        </div>
                        {s.isPr && (
                          <span className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded">
                            PR
                          </span>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
              {search && (
                <p className="text-xs text-muted-foreground">
                  Showing {filteredSessions.length} of {sessions.length} workouts
                </p>
              )}
            </>
          )}
        </div>
      )}

      {/* Calendar tab */}
      {activeTab === "calendar" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Link
              href="/history/edit"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-input text-foreground hover:bg-accent text-sm"
            >
              <Pencil className="w-4 h-4" />
              Edit entries
            </Link>
          </div>
          <HistoryCalendar userId={userId} />
        </div>
      )}

      {/* Table tab */}
      {activeTab === "table" && (
        <HistoryTableView sessions={sessions} />
      )}
    </div>
  );
}
