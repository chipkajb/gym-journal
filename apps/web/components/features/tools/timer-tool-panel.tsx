"use client";

import { useState } from "react";
import { WorkoutTimer, type TimerResult } from "@/components/features/workouts/workout-timer";
import { Clock, CheckCircle2 } from "lucide-react";

function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

type Props = {
  /** Use "section" when nested under a tools hub page title. */
  headingLevel?: "page" | "section";
};

export function TimerToolPanel({ headingLevel = "page" }: Props) {
  const [lastResult, setLastResult] = useState<TimerResult | null>(null);
  const HeadingTag = headingLevel === "section" ? "h2" : "h1";
  const headingClass =
    headingLevel === "section" ? "text-xl font-bold text-foreground" : "text-2xl font-bold text-foreground";

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Clock className="w-5 h-5 text-primary" />
        </div>
        <div>
          <HeadingTag className={headingClass}>Timer</HeadingTag>
          <p className="text-sm text-muted-foreground">
            Standalone timer — For Time, AMRAP, Tabata, EMOM, or free
          </p>
        </div>
      </div>

      <WorkoutTimer onFinish={result => setLastResult(result)} />

      {lastResult && (
        <div className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20 p-4 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-green-800 dark:text-green-300">
              Last result: {lastResult.label}
            </p>
            <p className="text-sm text-green-700 dark:text-green-400">
              {lastResult.mode.toUpperCase()} · {formatTime(lastResult.durationSeconds)}
            </p>
            <p className="text-xs text-green-600 dark:text-green-500 mt-1">
              To log this to a workout, go to{" "}
              <a href="/workouts/new" className="underline font-medium">
                Log workout
              </a>{" "}
              — the timer there will record your time automatically.
            </p>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-4 space-y-2">
        <h2 className="text-sm font-semibold text-foreground">Timer modes</h2>
        <dl className="space-y-1.5 text-sm">
          <div className="flex gap-2">
            <dt className="font-medium text-foreground w-28 shrink-0">Free Timer</dt>
            <dd className="text-muted-foreground">Count up indefinitely. Use for any open-ended workout.</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-medium text-foreground w-28 shrink-0">For Time</dt>
            <dd className="text-muted-foreground">Count up. Optional time cap — stops automatically when reached.</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-medium text-foreground w-28 shrink-0">AMRAP</dt>
            <dd className="text-muted-foreground">Count down from your target duration. Stops at zero.</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-medium text-foreground w-28 shrink-0">Tabata</dt>
            <dd className="text-muted-foreground">Alternating work/rest intervals (default 20s/10s × 8 rounds).</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-medium text-foreground w-28 shrink-0">EMOM</dt>
            <dd className="text-muted-foreground">Every Minute On the Minute — tracks rounds and time within each minute.</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
