"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function MetricsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Metrics page error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
      <AlertTriangle className="w-12 h-12 text-amber-500" />
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
        Could not load metrics
      </h2>
      <p className="text-gray-500 dark:text-gray-400 max-w-sm">
        Something went wrong while loading your body metrics.
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
      >
        Try again
      </button>
    </div>
  );
}
