"use client";

import type { ComponentProps } from "react";
import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BarChart3, Heart, TrendingUp } from "lucide-react";
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
        <h1 className="text-2xl font-bold text-foreground">Stats</h1>
      </div>

      <div
        role="tablist"
        aria-label="Stats sections"
        className="flex flex-nowrap gap-1 sm:gap-2 overflow-x-auto border-b border-border pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
          icon={TrendingUp}
          label="Workouts"
        />
        <TabButton
          id="tab-health"
          selected={view === "health"}
          onClick={() => setView("health")}
          icon={Heart}
          label="Health"
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
      className={`inline-flex shrink-0 items-center gap-1 sm:gap-2 rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium border transition-colors whitespace-nowrap ${
        selected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground hover:bg-accent"
      }`}
    >
      <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
      {label}
    </button>
  );
}
