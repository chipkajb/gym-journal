/** `m:ss`, or `h:mm:ss` once an hour is reached. Fractional seconds are floored. */
export function formatClock(totalSeconds: number): string {
  const total = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const ss = s.toString().padStart(2, "0");
  return h > 0 ? `${h}:${m.toString().padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

/**
 * Parses a duration typed by the user into seconds: `mm:ss`, `h:mm:ss`, or a bare
 * number of minutes. Returns null for blank or malformed input.
 */
export function parseDurationInput(val: string): number | null {
  const trimmed = val.trim();
  if (!trimmed) return null;
  if (trimmed.includes(":")) {
    const parts = trimmed.split(":").map(Number);
    if (parts.some((n) => !Number.isFinite(n) || n < 0)) return null;
    if (parts.length === 2) return parts[0]! * 60 + parts[1]!;
    if (parts.length === 3) return parts[0]! * 3600 + parts[1]! * 60 + parts[2]!;
    return null;
  }
  const minutes = Number(trimmed);
  return Number.isFinite(minutes) && minutes >= 0 ? Math.round(minutes * 60) : null;
}
