"use client";

import type { ComponentProps } from "react";
import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BarChart3, Heart, Lightbulb } from "lucide-react";
import { LeaderboardsClient } from "@/app/(auth)/leaderboards/leaderboards-client";
import { AnalyticsPageClient } from "@/app/(auth)/analytics/analytics-page-client";
import { HealthMetricsCharts } from "@/app/(auth)/analytics/health-metrics-charts";

type StatsView = "overview" | "workouts" | "health";

function parseView(raw: string | null): StatsView {
  if (raw === "workouts" || raw === "health") return raw;
  return "overview";
}

type LeaderboardProps = ComponentProps<typeof LeaderboardsClient>;
type AnalyticsProps = ComponentProps<typeof AnalyticsPageClient>;

export function StatsHubClient({
  leaderboard,
  analytics,
}: {
  leaderboard: LeaderboardProps;
  analytics: AnalyticsProps;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const view = useMemo(
    () => parseView(searchParams.get("view")),
    [searchParams]
  );

  const setView = useCallback(
    (next: StatsView) => {
      const qs = new URLSearchParams(searchParams.toString());
      if (next === "overview") qs.delete("view");
      else qs.set("view", next);
      const tail = qs.toString();
      router.replace(tail ? `/analytics?${tail}` : "/analytics", { scroll: false });
    },
    [router, searchParams]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Training stats</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Three views: momentum and volume, per-workout progress and PRs, and smartwatch trends over time.
        </p>
      </div>

      <div
        role="tablist"
        aria-label="Training stats sections"
        className="flex flex-wrap gap-2 border-b border-border pb-2"
      >
        <TabButton
          id="tab-overview"
          selected={view === "overview"}
          onClick={() => setView("overview")}
          icon={BarChart3}
          label="Overview"
        />
        <TabButton
          id="tab-workouts"
          selected={view === "workouts"}
          onClick={() => setView("workouts")}
          icon={Lightbulb}
          label="Workouts & PRs"
        />
        <TabButton
          id="tab-health"
          selected={view === "health"}
          onClick={() => setView("health")}
          icon={Heart}
          label="Health trends"
        />
      </div>

      <div role="tabpanel" aria-labelledby={`tab-${view}`} className="min-h-[12rem]">
        {view === "overview" && (
          <LeaderboardsClient
            {...leaderboard}
            headingLevel="section"
            pageTitle="Overview"
            pageDescription="Achievements, training rhythm, and a snapshot of wearable data."
            recentPrsMoreHref="/analytics?view=workouts"
          />
        )}
        {view === "workouts" && <AnalyticsPageClient {...analytics} layout="hub-workouts" />}
        {view === "health" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Daily rollups from sessions where you logged calories, duration, or heart rate. For quick totals
              in a date range, see the{" "}
              <button
                type="button"
                onClick={() => setView("overview")}
                className="text-primary font-medium hover:underline"
              >
                Overview
              </button>{" "}
              tab.
            </p>
            <HealthMetricsCharts />
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({
  id,
  selected,
  onClick,
  icon: Icon,
  label,
}: {
  id: string;
  selected: boolean;
  onClick: () => void;
  icon: typeof BarChart3;
  label: string;
}) {
  return (
    <button
      id={id}
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium border transition-colors ${
        selected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground hover:bg-accent"
      }`}
    >
      <Icon className="w-4 h-4 shrink-0" />
      {label}
    </button>
  );
}
