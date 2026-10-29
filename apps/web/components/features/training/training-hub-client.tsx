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

type WorkoutsProps = ComponentProps<typeof WorkoutsPageClient>;
type LibraryTemplates = ComponentProps<typeof LibraryCardGrid>["templates"];

const TABS: { id: TrainingTab; label: string; icon: typeof Shuffle }[] = [
  { id: "sessions", label: "Workouts", icon: PenLine },
  { id: "wod", label: "WOD Picker", icon: Shuffle },
  { id: "library", label: "Library", icon: BookOpen },
];

type Template = LibraryTemplates[number] & { description: string | null };

export function TrainingHubClient({
  templates,
  sessionsForWorkouts,
  userId,
}: {
  templates: Template[];
  sessionsForWorkouts: WorkoutsProps["sessions"];
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Training</h1>
        <div
          role="tablist"
          aria-label="Training sections"
          className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1 sm:inline-grid sm:w-auto"
        >
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              id={`tab-training-${id}`}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-all ${
                tab === id
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div
        role="tabpanel"
        aria-labelledby={`tab-training-${tab}`}
      >
        {tab === "wod" && <WodClient templates={templates} headingLevel="section" />}
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

            {templates.length === 0 ? (
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
              <LibraryCardGrid templates={templates} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
