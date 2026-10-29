"use client";

import { useState, useEffect } from "react";

type Props = { startedAt: string };

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function SessionTimer({ startedAt }: Props) {
  const [elapsed, setElapsed] = useState(0);
  const start = new Date(startedAt).getTime();

  useEffect(() => {
    const tick = () => setElapsed(Date.now() - start);
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [start]);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground mb-1">Elapsed</p>
      <p className="text-3xl font-mono font-semibold text-foreground">
        {formatDuration(elapsed)}
      </p>
    </div>
  );
}
