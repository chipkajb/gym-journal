"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Sparkles, Trophy } from "lucide-react";

type PoolItem = { headline: string; sub: string };

function buildCelebrationPool(title: string, result: string | null): PoolItem[] {
  const r = result?.trim() || "your result";
  const short = title.length > 28 ? `${title.slice(0, 26)}…` : title;
  return [
    { headline: "New PR unlocked", sub: `${short} — ${r}. That is how you move the line.` },
    { headline: "Personal record", sub: `${short} just got a new ceiling: ${r}.` },
    { headline: "You rewrote the chart", sub: `${short} · ${r}. Old best is in the rearview.` },
    { headline: "Numbers do not lie", sub: `${r} on ${short}. Proof in the logbook.` },
    { headline: "That is a breakthrough", sub: `${short}: ${r}. Savor it for a second.` },
    { headline: "Progress, stamped", sub: `${short} — ${r}. Another data point upward.` },
    { headline: "The bar moved", sub: `${short} at ${r}. Training paid rent today.` },
    { headline: "PR energy", sub: `${short}: ${r}. Consistency meets intensity.` },
    { headline: "History updated", sub: `Your best on ${short} is now ${r}.` },
    { headline: "Send it, logged it", sub: `${short} · ${r}. Future-you will nod.` },
    { headline: "Peak performance", sub: `${short} — ${r}. Not luck, work.` },
    { headline: "Stronger than your last log", sub: `${short}: ${r}. The trend is your friend.` },
    { headline: "Trophy moment", sub: `${short} at ${r}. Earned, not given.` },
    { headline: "New high water mark", sub: `${short} — ${r}.` },
    { headline: "Yes — that counts", sub: `${short}: ${r}. PR secured.` },
    { headline: "The logbook smiles", sub: `${short} · ${r}.` },
    { headline: "Standard raised", sub: `${short} — ${r}. Hold the standard.` },
    { headline: "PR: confirmed", sub: `${short} at ${r}.` },
    { headline: "You showed the data who is boss", sub: `${short}: ${r}.` },
    { headline: "Another rung", sub: `${short} — ${r}. Keep climbing.` },
    { headline: "New ceiling unlocked", sub: `${short} — ${r}. Raise the roof next time too.` },
    { headline: "That is the line moving", sub: `${short} at ${r}. Same lifts, new high mark.` },
    { headline: "PR stamped in ink", sub: `${short}: ${r}. Hard to argue with the logbook.` },
    { headline: "You leveled up", sub: `${short} · ${r}. Same workout, new standard.` },
    { headline: "Gravity took notes", sub: `${short} — ${r}. Heavier story, same bar.` },
    { headline: "Best-you showed up", sub: `${short}: ${r}. Carry that into the next session.` },
    { headline: "Chart says: up", sub: `${short} at ${r}. Momentum is not imaginary.` },
    { headline: "Unlocked: heavier chapter", sub: `${short} — ${r}. Turn the page when you are ready.` },
    { headline: "PR weather: sunny", sub: `${short}: ${r}. Forecast: more reps, same grit.` },
    { headline: "You outpaced your ghost", sub: `${short} · ${r}. Old PRs make great warmup weight.` },
    { headline: "The work cashed a check", sub: `${short} — ${r}. Interest paid in kilos or pounds.` },
    { headline: "Signature performance", sub: `${short}: ${r}. That is the version worth repeating.` },
  ];
}

export function WorkoutPrCelebration({
  workoutTitle,
  bestResultDisplay,
}: {
  workoutTitle: string;
  bestResultDisplay: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const picked = useRef<PoolItem | null>(null);

  const stripQuery = useCallback(() => {
    const qs = new URLSearchParams(searchParams.toString());
    qs.delete("celebrate");
    const tail = qs.toString();
    router.replace(tail ? `${pathname}?${tail}` : pathname, { scroll: false });
  }, [router, pathname, searchParams]);

  useEffect(() => {
    if (searchParams.get("celebrate") !== "pr") return;
    if (picked.current === null) {
      const pool = buildCelebrationPool(workoutTitle, bestResultDisplay);
      picked.current = pool[Math.floor(Math.random() * pool.length)]!;
    }
    setOpen(true);
  }, [searchParams, workoutTitle, bestResultDisplay]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      setOpen(false);
      stripQuery();
    }, 5200);
    return () => window.clearTimeout(t);
  }, [open, stripQuery]);

  if (!open || !picked.current) return null;
  const g = picked.current;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pr-celebration-title"
    >
      <div className="max-w-md w-full rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-50 via-card to-orange-50 dark:from-amber-950/40 dark:via-card dark:to-orange-950/30 p-6 shadow-xl space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-500/15 shrink-0">
            <Trophy className="w-7 h-7 text-amber-600 dark:text-amber-400" aria-hidden />
          </div>
          <div className="min-w-0">
            <p id="pr-celebration-title" className="text-lg font-bold text-foreground flex items-center gap-2">
              {g.headline}
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" aria-hidden />
            </p>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{g.sub}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            stripQuery();
          }}
          className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Nice
        </button>
      </div>
    </div>
  );
}
