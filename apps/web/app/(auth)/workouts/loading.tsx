export default function WorkoutsLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 bg-muted rounded w-40" />
        <div className="h-9 bg-muted rounded w-32" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4">
            <div className="h-5 bg-muted rounded w-48 mb-2" />
            <div className="h-4 bg-muted rounded w-32" />
          </div>
        ))}
      </div>
    </div>
  );
}
