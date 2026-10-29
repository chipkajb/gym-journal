"use client";

import type { ComponentProps } from "react";
import { HubHeader, useTabParam, type HubTab } from "@/components/ui/hub-tabs";
import { BarChart3, Heart, TrendingUp } from "lucide-react";
import { LeaderboardsClient } from "@/app/(auth)/leaderboards/leaderboards-client";
import { AnalyticsPageClient } from "@/app/(auth)/analytics/analytics-page-client";
import { HealthMetricsCharts } from "@/app/(auth)/analytics/health-metrics-charts";

const STATS_TABS = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "workouts", label: "Workouts", icon: TrendingUp },
  { id: "health", label: "Health", icon: Heart },
] as const satisfies readonly HubTab<string>[];

type LeaderboardProps = ComponentProps<typeof LeaderboardsClient>;
type AnalyticsProps = ComponentProps<typeof AnalyticsPageClient>;

export function StatsHubClient({
  leaderboard,
  analytics,
}: {
  leaderboard: LeaderboardProps;
  analytics: AnalyticsProps;
}) {
  const [view, setView] = useTabParam("view", STATS_TABS);

  return (
    <div className="space-y-6">
      <HubHeader
        title="Stats"
        label="Stats sections"
        idPrefix="tab-stats"
        tabs={STATS_TABS}
        active={view}
        onSelect={setView}
      />

      <div role="tabpanel" id="tab-stats-panel" aria-labelledby={`tab-stats-${view}`} className="min-h-[12rem]">
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

