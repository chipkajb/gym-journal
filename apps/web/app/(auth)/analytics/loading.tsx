import { BarChart3 } from "lucide-react";

export default function AnalyticsLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <BarChart3 className="w-7 h-7" />
          Progress & analytics
        </h1>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64 mt-2" />
      </div>

      {/* Summary cards skeleton */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-3" />
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16" />
          </div>
        ))}
      </div>

      {/* Chart skeletons */}
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4" />
          <div className="h-56 bg-gray-100 dark:bg-gray-700/50 rounded-lg" />
        </div>
      ))}
    </div>
  );
}
