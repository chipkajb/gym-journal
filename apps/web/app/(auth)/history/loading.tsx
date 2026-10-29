export default function HistoryLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 bg-muted rounded w-48" />
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="h-5 bg-muted rounded w-32 mb-4" />
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="h-10 bg-muted rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}
