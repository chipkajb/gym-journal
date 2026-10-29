import { Lightbulb } from "lucide-react";

export default function AnalyticsLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Lightbulb className="w-7 h-7" />
          Progress & analytics
        </h1>
        <div className="h-4 bg-muted rounded w-64 mt-2" />
      </div>

      {/* Summary cards skeleton */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4">
            <div className="h-4 bg-muted rounded w-32 mb-3" />
            <div className="h-8 bg-muted rounded w-16" />
          </div>
        ))}
      </div>

      {/* Chart skeletons */}
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-4">
          <div className="h-5 bg-muted rounded w-48 mb-4" />
          <div className="h-56 bg-muted rounded-lg" />
        </div>
      ))}
    </div>
  );
}
