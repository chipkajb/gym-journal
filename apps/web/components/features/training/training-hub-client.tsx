"use client";

import type { ComponentProps } from "react";
import { useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BookOpen, PenLine, Plus, Shuffle } from "lucide-react";
import { WodClient } from "@/app/(auth)/wod/wod-client";
import { WorkoutsPageClient } from "@/app/(auth)/workouts/workouts-client";
import { LibraryCardGrid } from "@/components/features/library/library-card-grid";

type TrainingTab = "wod" | "sessions" | "library";

function parseTab(raw: string | null): TrainingTab {
  if (raw === "wod" || raw === "library") return raw;
  return "sessions";
}

type WodProps = ComponentProps<typeof WodClient>;
type WorkoutsProps = ComponentProps<typeof WorkoutsPageClient>;
type LibraryTemplates = ComponentProps<typeof LibraryCardGrid>["templates"];

export function TrainingHubClient({
  wodTemplates,
  sessionsForWorkouts,
  libraryTemplates,
  userId,
}: {
  wodTemplates: WodProps["templates"];
  sessionsForWorkouts: WorkoutsProps["sessions"];
  libraryTemplates: LibraryTemplates;
  userId: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = useMemo(() => parseTab(searchParams.get("tab")), [searchParams]);

  const setTab = useCallback(
    (next: TrainingTab) => {
      const qs = new URLSearchParams(searchParams.toString());
      if (next === "sessions") qs.delete("tab");
      else qs.set("tab", next);
      const tail = qs.toString();
      router.replace(tail ? `/training?${tail}` : "/training", { scroll: false });
    },
    [router, searchParams]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Training</h1>
      </div>

      <div
        role="tablist"
        aria-label="Training sections"
        className="flex flex-nowrap gap-1 sm:gap-2 overflow-x-auto border-b border-border pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <button
          id="tab-training-wod"
          type="button"
          role="tab"
          aria-selected={tab === "wod"}
          onClick={() => setTab("wod")}
          className={`inline-flex shrink-0 items-center gap-1 sm:gap-2 rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium border transition-colors whitespace-nowrap ${
            tab === "wod"
              ? "border-primary bg-primary text-primary-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground hover:bg-accent"
          }`}
        >
          <Shuffle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          WOD Picker
        </button>
        <button
          id="tab-training-sessions"
          type="button"
          role="tab"
          aria-selected={tab === "sessions"}
          onClick={() => setTab("sessions")}
          className={`inline-flex shrink-0 items-center gap-1 sm:gap-2 rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium border transition-colors whitespace-nowrap ${
            tab === "sessions"
              ? "border-primary bg-primary text-primary-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground hover:bg-accent"
          }`}
        >
          <PenLine className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          Workouts
        </button>
        <button
          id="tab-training-library"
          type="button"
          role="tab"
          aria-selected={tab === "library"}
          onClick={() => setTab("library")}
          className={`inline-flex shrink-0 items-center gap-1 sm:gap-2 rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium border transition-colors whitespace-nowrap ${
            tab === "library"
              ? "border-primary bg-primary text-primary-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground hover:bg-accent"
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          Library
        </button>
      </div>

      <div
        role="tabpanel"
        aria-labelledby={
          tab === "wod" ? "tab-training-wod" : tab === "library" ? "tab-training-library" : "tab-training-sessions"
        }
      >
        {tab === "wod" && <WodClient templates={wodTemplates} headingLevel="section" />}
        {tab === "sessions" && (
          <WorkoutsPageClient
            sessions={sessionsForWorkouts}
            userId={userId}
            urlBasePath="/training"
            headingLevel="section"
          />
        )}
        {tab === "library" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-xl font-bold text-foreground">Workout Library</h2>
              <div className="flex gap-2">
                <Link
                  href="/library/templates/new"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  New template
                </Link>
              </div>
            </div>

            {libraryTemplates.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-12 text-center">
                <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  No workout templates yet. Create one or import from CSV.
                </p>
                <Link
                  href="/library/templates/new"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Create template
                </Link>
              </div>
            ) : (
              <LibraryCardGrid templates={libraryTemplates} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
