export default function HistoryLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48" />
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4" />
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 dark:bg-gray-700/50 rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}
