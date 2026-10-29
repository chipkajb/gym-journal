/** Pure timer math: parsing clock input, round splits, and the final result. */
import { formatClock } from "@/lib/duration";

export type TimerMode = "free" | "fortime" | "amrap" | "tabata" | "emom";

export type TimerResult = {
  mode: TimerMode;
  durationSeconds: number;
  label: string;
  roundsNote?: string;
};

export type Round = {
  round: number;
  elapsed: number;
  split: number;
  /** seconds faster (+) or slower (-) than previous round split */
  diffVsPrevSec: number | null;
};

export function parseMmSs(val: string): number {
  const parts = val.split(":").map(Number);
  if (parts.length === 2) return (parts[0] ?? 0) * 60 + (parts[1] ?? 0);
  if (parts.length === 1) return parts[0] ?? 0;
  return 0;
}

/** Parses display strings like `m:ss`, `mm:ss`, or `h:mm:ss` into total seconds. */
export function parseDisplayTime(val: string): number {
  const trimmed = val.trim();
  if (!trimmed) return 0;
  const parts = trimmed.split(":").map((p) => Number.parseInt(p.trim(), 10));
  if (parts.some((n) => Number.isNaN(n))) return 0;
  if (parts.length === 3) return parts[0]! * 3600 + parts[1]! * 60 + parts[2]!;
  if (parts.length === 2) return parts[0]! * 60 + parts[1]!;
  return parts[0]! ?? 0;
}

export function buildRoundsNoteFromRounds(rounds: Round[], totalSeconds: number): string | undefined {
  if (rounds.length === 0) return undefined;
  const lastMark = rounds[rounds.length - 1]!.elapsed;
  const tailRemainderSec = Math.max(0, Math.round(totalSeconds - lastMark));
  const lines = [
    "Round splits:",
    ...rounds.map((r) => `Round ${r.round}: ${formatClock(Math.round(r.split))}`),
  ];
  if (tailRemainderSec > 0) {
    lines.push(`Time after last split: ${formatClock(tailRemainderSec)}`);
  }
  return lines.join("\n");
}

export function recomputeRoundDiffs(rounds: Round[]): Round[] {
  return rounds.map((r, i) => {
    const prevSplit = i > 0 ? rounds[i - 1]!.split : null;
    const diffVsPrevSec = prevSplit != null ? Math.round(prevSplit - r.split) : null;
    return { ...r, diffVsPrevSec };
  });
}

/**
 * When shortening total time, trim from tail after last split first, then from round splits
 * (last round first) so Notes stay consistent with the edited clock.
 */
export function adjustRoundsAfterTimeTrim(
  baseTotalSec: number,
  newTotalSec: number,
  rounds: Round[]
): Round[] {
  if (rounds.length === 0 || newTotalSec >= baseTotalSec) {
    return rounds.map((r) => ({ ...r }));
  }

  let remaining = Math.round(baseTotalSec - newTotalSec);
  if (remaining <= 0) return rounds.map((r) => ({ ...r }));

  const adj: Round[] = rounds.map((r) => ({
    round: r.round,
    elapsed: r.elapsed,
    split: r.split,
    diffVsPrevSec: r.diffVsPrevSec,
  }));

  const baseTail = Math.max(
    0,
    Math.round(baseTotalSec - adj[adj.length - 1]!.elapsed)
  );
  remaining -= Math.min(remaining, baseTail);

  while (remaining > 0 && adj.length > 0) {
    const li = adj.length - 1;
    const prevElapsed = li > 0 ? adj[li - 1]!.elapsed : 0;
    const last = adj[li]!;
    const splitRounded = Math.max(0, Math.round(last.split));
    if (splitRounded === 0) {
      adj.pop();
      continue;
    }
    const take = Math.min(remaining, splitRounded);
    last.split -= take;
    remaining -= take;
    last.elapsed = prevElapsed + last.split;
    if (Math.round(last.split) <= 0) {
      adj.pop();
    }
  }

  let cum = 0;
  for (let i = 0; i < adj.length; i++) {
    const chunk = Math.max(0, adj[i]!.split);
    adj[i]!.split = chunk;
    cum += chunk;
    adj[i]!.elapsed = cum;
  }

  return recomputeRoundDiffs(adj);
}

export function buildFinalTimerResult(
  result: TimerResult,
  finishTimeInput: string,
  mode: TimerMode,
  rounds: Round[]
): TimerResult {
  const baseTotal = result.durationSeconds;
  const parsed = parseDisplayTime(finishTimeInput);
  const newTotal = Math.max(0, Math.round(parsed));
  const supportsRoundsLocal = mode === "free" || mode === "fortime" || mode === "amrap";

  if (!supportsRoundsLocal || rounds.length === 0) {
    let roundsNote = result.roundsNote;
    if (supportsRoundsLocal && rounds.length === 0 && newTotal > baseTotal) {
      roundsNote = [result.roundsNote, `Adjusted clock +${newTotal - baseTotal}s after stop.`]
        .filter(Boolean)
        .join("\n\n");
    }
    return {
      ...result,
      durationSeconds: newTotal,
      label: formatClock(newTotal),
      roundsNote,
    };
  }

  let nextRounds = rounds;
  if (newTotal < baseTotal) {
    nextRounds = adjustRoundsAfterTimeTrim(baseTotal, newTotal, rounds);
  }

  let roundsNote = buildRoundsNoteFromRounds(nextRounds, newTotal);
  if (newTotal > baseTotal) {
    const extra = newTotal - baseTotal;
    roundsNote = [roundsNote, `Adjusted clock +${extra}s after stop.`].filter(Boolean).join("\n\n");
  }

  return {
    mode,
    durationSeconds: newTotal,
    label: formatClock(newTotal),
    roundsNote,
  };
}
