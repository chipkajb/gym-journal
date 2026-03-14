export default function LibraryLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48" />
        <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded w-32" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-36 mb-3" />
            <div className="h-4 bg-gray-100 dark:bg-gray-700/50 rounded w-full mb-2" />
            <div className="h-4 bg-gray-100 dark:bg-gray-700/50 rounded w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}
