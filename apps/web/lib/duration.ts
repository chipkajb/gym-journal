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

/**
 * Formats raw keystrokes as a clock, filling from the right like a microwave:
 * "2" -> "0:02", "213" -> "2:13", "2132" -> "21:32", "12345" -> "1:23:45".
 * Non-digits are dropped, so backspacing through the colon just works.
 */
export function maskClockInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").replace(/^0+/, "").slice(0, 6);
  if (!digits) return "";
  const padded = digits.padStart(3, "0");
  const ss = padded.slice(-2);
  const rest = padded.slice(0, -2);
  if (rest.length <= 2) return `${rest}:${ss}`;
  return `${rest.slice(0, -2)}:${rest.slice(-2)}:${ss}`;
}
