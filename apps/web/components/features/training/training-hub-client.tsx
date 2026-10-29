"use client";

import type { ComponentProps } from "react";
import Link from "next/link";
import { HubHeader, useTabParam, type HubTab } from "@/components/ui/hub-tabs";
import { BookOpen, PenLine, Plus, Shuffle } from "lucide-react";
import { WodClient } from "@/app/(auth)/wod/wod-client";
import { WorkoutsPageClient } from "@/app/(auth)/workouts/workouts-client";
import { LibraryCardGrid } from "@/components/features/library/library-card-grid";

type WorkoutsProps = ComponentProps<typeof WorkoutsPageClient>;
type LibraryTemplates = ComponentProps<typeof LibraryCardGrid>["templates"];

const TRAINING_TABS = [
  { id: "sessions", label: "Workouts", icon: PenLine },
  { id: "wod", label: "WOD Picker", icon: Shuffle },
  { id: "library", label: "Library", icon: BookOpen },
] as const satisfies readonly HubTab<string>[];

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
  const [tab, setTab] = useTabParam("tab", TRAINING_TABS);

  return (
    <div className="space-y-6">
      <HubHeader
        title="Training"
        label="Training sections"
        idPrefix="tab-training"
        tabs={TRAINING_TABS}
        active={tab}
        onSelect={setTab}
      />

      <div
        role="tabpanel"
        id="tab-training-panel"
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
