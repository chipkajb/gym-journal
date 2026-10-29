export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading dashboard">
      <div className="space-y-2">
        <div className="h-8 w-64 rounded bg-muted" />
        <div className="h-4 w-48 rounded bg-muted" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-12 rounded-xl bg-muted" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-[74px] rounded-xl border border-border bg-card" />
        ))}
      </div>
      <div className="space-y-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-14 rounded-xl border border-border bg-card" />
        ))}
      </div>
    </div>
  );
}
