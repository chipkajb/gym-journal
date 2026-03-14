import { Scale } from "lucide-react";

export default function MetricsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Scale className="w-7 h-7" />
          Body Metrics
        </h1>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-56 mt-2" />
      </div>
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-4" />
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-gray-100 dark:bg-gray-700/50 rounded-lg" />
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4" />
        <div className="h-56 bg-gray-100 dark:bg-gray-700/50 rounded-lg" />
      </div>
    </div>
  );
}
