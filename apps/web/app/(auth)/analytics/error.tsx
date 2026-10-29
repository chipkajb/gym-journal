"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function AnalyticsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Analytics page error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
      <AlertTriangle className="w-12 h-12 text-amber-500" />
      <h2 className="text-xl font-semibold text-foreground">
        Could not load analytics
      </h2>
      <p className="text-muted-foreground max-w-sm">
        Something went wrong while loading your analytics data.
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 text-sm font-medium bg-primary hover:bg-primary/90 text-white rounded-lg"
      >
        Try again
      </button>
    </div>
  );
}
