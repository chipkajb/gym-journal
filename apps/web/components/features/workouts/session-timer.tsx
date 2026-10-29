"use client";

import { useState, useEffect } from "react";
import { formatClock } from "@/lib/duration";

type Props = { startedAt: string };

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
        {formatClock(elapsed / 1000)}
      </p>
    </div>
  );
}
