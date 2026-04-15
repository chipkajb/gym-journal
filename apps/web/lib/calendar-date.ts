/**
 * Workout "dates" are calendar days from the user (YYYY-MM-DD). We store them as
 * UTC noon on that calendar day so the same day is shown in every timezone and
 * list/detail views stay consistent.
 */

export function parseWorkoutDateInput(input: string): Date {
  const t = input.trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(t);
  if (m) {
    const y = parseInt(m[1]!, 10);
    const mo = parseInt(m[2]!, 10);
    const d = parseInt(m[3]!, 10);
    if (mo >= 1 && mo <= 12 && d >= 1 && d <= 31) {
      return new Date(Date.UTC(y, mo - 1, d, 12, 0, 0));
    }
  }
  return new Date(t);
}

/** Today's calendar date in the user's local timezone (for date inputs). */
export function localCalendarYmd(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const UTC_DISPLAY: Intl.DateTimeFormatOptions = {
  timeZone: "UTC",
  month: "long",
  day: "numeric",
  year: "numeric",
};

const UTC_DISPLAY_SHORT: Intl.DateTimeFormatOptions = {
  timeZone: "UTC",
  month: "short",
  day: "numeric",
  year: "numeric",
};

/** Format a stored workout instant as the calendar day it represents (globally consistent). */
export function formatWorkoutCalendarDate(
  d: Date | string,
  style: "long" | "short" = "long"
): string {
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "";
  const opts = style === "long" ? UTC_DISPLAY : UTC_DISPLAY_SHORT;
  return new Intl.DateTimeFormat("en-US", opts).format(date);
}

/** Compact month + day for charts (e.g. "Apr 15"). */
export function formatWorkoutCalendarMonthDay(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
  }).format(date);
}
