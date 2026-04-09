"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Shuffle,
  RotateCcw,
  Filter,
  Trophy,
  Clock,
  Calendar,
  CheckCircle,
  PenLine,
  ChevronDown,
  ChevronUp,
  History,
} from "lucide-react";
import { WorkoutHistoryPanel } from "@/components/features/workouts/workout-history-panel";
import type { HistorySession } from "@/components/features/workouts/workout-history-panel";
import { roundOneRepMax } from "@/lib/workout-utils";

type Session = {
  id: string;
  workoutDate: string;
  bestResultRaw: number | null;
  bestResultDisplay: string | null;
  rxOrScaled: string | null;
  isPr: boolean;
  scoreType: string | null;
  notes: string | null;
};

type Template = {
  id: string;
  title: string;
  description: string | null;
  scoreType: string | null;
  barbellLift: string | null;
  sessions: Session[];
};

type Filters = {
  scoreTypes: string[];
  doneStatus: "any" | "done" | "never";
  rxFilter: "any" | "rx" | "scaled";
  durationBucket: "any" | "short" | "medium" | "long" | "very-long";
};

// Duration buckets based on time-scored workouts (in seconds)
const DURATION_BUCKETS = {
  short: { label: "< 10 min", min: 0, max: 600 },
  medium: { label: "10–20 min", min: 600, max: 1200 },
  long: { label: "20–30 min", min: 1200, max: 1800 },
  "very-long": { label: "> 30 min", min: 1800, max: Infinity },
};

const ALL_SCORE_TYPES = ["Time", "Reps", "Load", "Rounds + Reps"];

function getAvgDuration(sessions: Session[]): number | null {
  const timeSessions = sessions.filter(
    (s) => s.scoreType === "Time" && s.bestResultRaw != null
  );
  if (timeSessions.length === 0) return null;
  const avg =
    timeSessions.reduce((sum, s) => sum + (s.bestResultRaw ?? 0), 0) /
    timeSessions.length;
  return avg;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Best (PR) session for a template */
function getBestSession(sessions: Session[]): Session | undefined {
  return sessions.find((s) => s.isPr) ?? sessions[0];
}

export function WodClient({ templates }: { templates: Template[] }) {
  const [filters, setFilters] = useState<Filters>({
    scoreTypes: [],
    doneStatus: "any",
    rxFilter: "any",
    durationBucket: "any",
  });
  const [selected, setSelected] = useState<Template | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [spinCount, setSpinCount] = useState(0);

  const filtered = useMemo(() => {
    return templates.filter((t) => {
      // Score type filter
      if (
        filters.scoreTypes.length > 0 &&
        !filters.scoreTypes.includes(t.scoreType ?? "")
      ) {
        return false;
      }
      // Done status filter
      if (filters.doneStatus === "done" && t.sessions.length === 0) return false;
      if (filters.doneStatus === "never" && t.sessions.length > 0) return false;
      // RX filter
      if (
        filters.rxFilter === "rx" &&
        !t.sessions.some((s) => s.rxOrScaled === "RX")
      )
        return false;
      if (
        filters.rxFilter === "scaled" &&
        !t.sessions.some((s) => s.rxOrScaled === "Scaled")
      )
        return false;
      // Duration filter (only applies to Time-scored workouts with history)
      if (filters.durationBucket !== "any") {
        if (t.scoreType !== "Time") return false;
        const avg = getAvgDuration(t.sessions);
        if (avg === null) return true; // Never done - include if looking by duration
        const bucket = DURATION_BUCKETS[filters.durationBucket];
        if (avg < bucket.min || avg >= bucket.max) return false;
      }
      return true;
    });
  }, [templates, filters]);

  const pickRandom = useCallback(() => {
    if (filtered.length === 0) return;
    const pool = selected
      ? filtered.filter((t) => t.id !== selected.id)
      : filtered;
    if (pool.length === 0) return;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    setSelected(pick);
    setShowHistory(false);
    setSpinCount((c) => c + 1);
  }, [filtered, selected]);

  const toggleScoreType = (st: string) => {
    setFilters((f) => ({
      ...f,
      scoreTypes: f.scoreTypes.includes(st)
        ? f.scoreTypes.filter((s) => s !== st)
        : [...f.scoreTypes, st],
    }));
  };

  const clearFilters = () => {
    setFilters({
      scoreTypes: [],
      doneStatus: "any",
      rxFilter: "any",
      durationBucket: "any",
    });
  };

  const hasActiveFilters =
    filters.scoreTypes.length > 0 ||
    filters.doneStatus !== "any" ||
    filters.rxFilter !== "any" ||
    filters.durationBucket !== "any";

  const lastSession = selected?.sessions[0];
  const bestSession = selected ? getBestSession(selected.sessions) : undefined;
  const avgDuration = selected ? getAvgDuration(selected.sessions) : null;

  const historySessions: HistorySession[] = (selected?.sessions ?? []).map(
    (s) => s
  );

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">WOD Picker</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {filtered.length} workout{filtered.length !== 1 ? "s" : ""} available
          </p>
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
            hasActiveFilters
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:text-foreground hover:bg-accent"
          }`}
        >
          <Filter className="w-4 h-4" />
          Filters
          {hasActiveFilters && (
            <span className="bg-primary text-primary-foreground text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {
                [
                  filters.scoreTypes.length > 0,
                  filters.doneStatus !== "any",
                  filters.rxFilter !== "any",
                  filters.durationBucket !== "any",
                ].filter(Boolean).length
              }
            </span>
          )}
          {showFilters ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="p-4 rounded-xl bg-card border border-border space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">Filters</span>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-primary hover:text-primary/80 font-medium"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Score Type */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Score Type
            </label>
            <div className="flex flex-wrap gap-2 mt-2">
              {ALL_SCORE_TYPES.map((st) => (
                <button
                  key={st}
                  onClick={() => toggleScoreType(st)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filters.scoreTypes.includes(st)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Duration (Time WODs)
            </label>
            <div className="flex flex-wrap gap-2 mt-2">
              {(
                [
                  ["any", "Any"],
                  ...Object.entries(DURATION_BUCKETS).map(([k, v]) => [
                    k,
                    v.label,
                  ]),
                ] as [string, string][]
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() =>
                    setFilters((f) => ({
                      ...f,
                      durationBucket: key as Filters["durationBucket"],
                    }))
                  }
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filters.durationBucket === key
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Done Status */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              History
            </label>
            <div className="flex flex-wrap gap-2 mt-2">
              {(["any", "done", "never"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setFilters((f) => ({ ...f, doneStatus: v }))}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                    filters.doneStatus === v
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {v === "any"
                    ? "Any"
                    : v === "done"
                    ? "Done before"
                    : "Never done"}
                </button>
              ))}
            </div>
          </div>

          {/* RX Filter */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Performance Level
            </label>
            <div className="flex flex-wrap gap-2 mt-2">
              {(["any", "rx", "scaled"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() =>
                    setFilters((f) => ({ ...f, rxFilter: v }))
                  }
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                    filters.rxFilter === v
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {v === "any" ? "Any" : v.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Picker Area */}
      <div className="text-center">
        {filtered.length === 0 ? (
          <div className="p-12 rounded-xl bg-card border border-dashed border-border">
            <p className="text-muted-foreground mb-3">
              No workouts match your filters.
            </p>
            <button
              onClick={clearFilters}
              className="text-sm text-primary hover:text-primary/80 font-medium"
            >
              Clear filters
            </button>
          </div>
        ) : !selected ? (
          <div className="p-12 rounded-xl bg-card border border-border">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shuffle className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">
              Ready to pick a WOD?
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              {filtered.length} workout{filtered.length !== 1 ? "s" : ""} in
              the pool
            </p>
            <button
              onClick={pickRandom}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-base hover:bg-primary/90 transition-colors shadow-lg"
            >
              <Shuffle className="w-5 h-5" />
              Pick a Workout
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Selected Workout Card */}
            <div className="p-6 rounded-xl bg-card border-2 border-primary/40 shadow-sm text-left">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {selected.scoreType && (
                      <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {selected.scoreType}
                      </span>
                    )}
                    {selected.barbellLift && (
                      <span className="text-xs font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                        {selected.barbellLift}
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">
                    {selected.title}
                  </h2>
                </div>
                {selected.sessions.length > 0 && (
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">Times done</p>
                    <p className="text-2xl font-bold text-foreground">
                      {selected.sessions.length}
                    </p>
                  </div>
                )}
              </div>

              {selected.description && (
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed whitespace-pre-line">
                  {selected.description}
                </p>
              )}

              {/* Stats Row */}
              {selected.sessions.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                  {lastSession?.bestResultDisplay && (
                    <div className="p-3 rounded-lg bg-muted">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          Last Result
                        </span>
                      </div>
                      <p className="font-semibold text-foreground text-sm">
                        {lastSession.bestResultDisplay}
                      </p>
                      {lastSession.rxOrScaled && (
                        <p
                          className={`text-xs font-medium mt-0.5 ${
                            lastSession.rxOrScaled === "RX"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-amber-600 dark:text-amber-400"
                          }`}
                        >
                          {lastSession.rxOrScaled}
                        </p>
                      )}
                    </div>
                  )}
                  {avgDuration !== null && (
                    <div className="p-3 rounded-lg bg-muted">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          Avg Time
                        </span>
                      </div>
                      <p className="font-semibold text-foreground text-sm">
                        {formatDuration(avgDuration)}
                      </p>
                    </div>
                  )}
                  {lastSession && (
                    <div className="p-3 rounded-lg bg-muted">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          Last Done
                        </span>
                      </div>
                      <p className="font-semibold text-foreground text-sm">
                        {new Date(lastSession.workoutDate).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric" }
                        )}
                      </p>
                    </div>
                  )}
                  {bestSession?.isPr && bestSession.bestResultDisplay && (
                    <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Trophy className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-xs text-emerald-700 dark:text-emerald-300">
                          Personal Record
                        </span>
                      </div>
                      <p className="font-semibold text-emerald-700 dark:text-emerald-300 text-sm">
                        {bestSession.bestResultDisplay}
                      </p>
                      {bestSession.scoreType === "Load" &&
                        bestSession.bestResultRaw != null && (
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                            est. 1RM: ~
                            {roundOneRepMax(bestSession.bestResultRaw)}
                          </p>
                        )}
                    </div>
                  )}
                </div>
              )}

              {selected.sessions.length === 0 && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 mb-4">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span className="text-sm font-medium">
                    You haven&apos;t done this workout yet!
                  </span>
                </div>
              )}

              <Link
                href={`/workouts/new?templateId=${selected.id}`}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors"
              >
                <PenLine className="w-4 h-4" />
                Log This Workout
              </Link>
            </div>

            {/* History toggle */}
            {selected.sessions.length > 0 && (
              <button
                onClick={() => setShowHistory((v) => !v)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-foreground font-medium text-sm hover:bg-accent transition-colors"
              >
                <History className="w-4 h-4" />
                {showHistory ? "Hide history" : "View history"}
                <span className="text-xs text-muted-foreground">
                  ({selected.sessions.length})
                </span>
              </button>
            )}

            {showHistory && selected.sessions.length > 0 && (
              <div className="p-4 rounded-xl bg-card border border-border text-left">
                <p className="text-sm font-semibold text-foreground mb-3">
                  History — {selected.title}
                </p>
                <WorkoutHistoryPanel sessions={historySessions} initialLimit={10} />
              </div>
            )}

            {/* Try Again Button */}
            <button
              onClick={pickRandom}
              disabled={filtered.length <= 1}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-foreground font-medium text-sm hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RotateCcw className="w-4 h-4" />
              Try Another ({spinCount} picked so far)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
