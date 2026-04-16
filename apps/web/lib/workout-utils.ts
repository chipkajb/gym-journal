/**
 * Epley's formula for estimating 1-rep max from a sub-maximal effort.
 * Returns the weight itself when reps === 1 (true max lift).
 */
export function epleyOneRepMax(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

/** Round a 1RM estimate to the nearest 0.5 lb/kg */
export function roundOneRepMax(value: number): number {
  return Math.round(value * 2) / 2;
}

/**
 * Convert a user-entered display result to a raw numeric value for sorting/PR detection.
 * Returns null if the display is empty or cannot be parsed.
 */
export function displayToRaw(display: string, scoreType: string): number | null {
  const trimmed = display.trim();
  if (!trimmed) return null;

  switch (scoreType) {
    case "Time": {
      const parts = trimmed.split(":").map(Number);
      if (parts.some((p) => isNaN(p))) return null;
      if (parts.length === 2) return (parts[0] ?? 0) * 60 + (parts[1] ?? 0);
      if (parts.length === 3)
        return (parts[0] ?? 0) * 3600 + (parts[1] ?? 0) * 60 + (parts[2] ?? 0);
      return null;
    }
    case "Reps": {
      const n = Number(trimmed);
      return isNaN(n) ? null : Math.round(n);
    }
    case "Rounds + Reps": {
      // "5+2" → 5.02 (rounds + reps/100)
      const match = trimmed.match(/^(\d+)\+(\d+)$/);
      if (!match) return null;
      return parseInt(match[1]!) + parseInt(match[2]!) / 100;
    }
    case "Load": {
      const n = Number(trimmed);
      return isNaN(n) ? null : n;
    }
    default:
      return null;
  }
}

/**
 * Validate a display result string for a given score type.
 * Returns an error message string, or null if valid (including empty).
 */
export function validateDisplayResult(
  display: string,
  scoreType: string
): string | null {
  const trimmed = display.trim();
  if (!trimmed) return null; // empty is always OK

  switch (scoreType) {
    case "Time":
      if (!/^\d+:\d{2}(:\d{2})?$/.test(trimmed))
        return 'Use mm:ss or hh:mm:ss — e.g. "10:44"';
      return null;
    case "Reps":
      if (!/^\d+(\.\d+)?$/.test(trimmed)) return "Enter a number — e.g. 42";
      return null;
    case "Rounds + Reps":
      if (!/^\d+\+\d+$/.test(trimmed))
        return 'Use rounds+reps — e.g. "5+2"';
      return null;
    case "Load":
      if (isNaN(Number(trimmed))) return "Enter a number — e.g. 225";
      return null;
    default:
      return "Pick a valid score type";
  }
}

/** Placeholder text for the result input based on score type */
export function getResultPlaceholder(scoreType: string): string {
  switch (scoreType) {
    case "Time":
      return "e.g. 10:44";
    case "Reps":
      return "e.g. 42";
    case "Load":
      return "e.g. 225";
    case "Rounds + Reps":
      return "e.g. 5+2";
    default:
      return "e.g. 10:44, 5+2, 225";
  }
}

/** Build a Load display string from weight and reps */
export function buildLoadDisplay(weight: number, reps: number): string {
  if (reps === 1) return String(weight);
  return `${weight} x ${reps}`;
}

/** Best estimated 1RM from setDetails: single { weight, reps } or { sets: [...] }. */
export function bestOneRmFromLoadSetDetails(setDetails: unknown): number | null {
  if (!setDetails || typeof setDetails !== "object") return null;
  const o = setDetails as Record<string, unknown>;
  if (Array.isArray(o.sets)) {
    let best = 0;
    for (const row of o.sets) {
      if (row && typeof row === "object") {
        const r = row as { weight?: unknown; reps?: unknown };
        const w = Number(r.weight);
        const rep = Number(r.reps) || 1;
        if (!isNaN(w) && w > 0 && rep > 0) {
          const rm = roundOneRepMax(epleyOneRepMax(w, rep));
          if (rm > best) best = rm;
        }
      }
    }
    return best > 0 ? best : null;
  }
  if (typeof o.weight === "number" && typeof o.reps === "number") {
    return roundOneRepMax(epleyOneRepMax(o.weight, o.reps));
  }
  return null;
}

/** Rows with positive weight and positive reps (Epley input). Skips blank rows. */
export function parseValidLoadSets(
  sets: Array<{ weight: string; reps: string }>
): Array<{ weight: number; reps: number }> {
  const out: Array<{ weight: number; reps: number }> = [];
  for (const s of sets) {
    const w = parseFloat(s.weight);
    const r = parseInt(s.reps, 10);
    if (!isNaN(w) && w > 0 && !isNaN(r) && r > 0) {
      out.push({ weight: w, reps: r });
    }
  }
  return out;
}

/**
 * Catch half-filled rows before save. Returns null if every non-empty field is paired
 * (weight with reps and vice versa).
 */
export function validateLoadSetRows(
  sets: Array<{ weight: string; reps: string }>
): string | null {
  for (const s of sets) {
    const w = parseFloat(s.weight);
    const r = parseInt(s.reps, 10);
    const weightEntered = s.weight.trim() !== "";
    const repsEntered = s.reps.trim() !== "";
    const hasWeight = weightEntered && !isNaN(w) && w > 0;
    const hasReps = repsEntered && !isNaN(r) && r > 0;
    if (hasWeight && !hasReps) {
      return "Enter reps for every set that has a weight.";
    }
    if (hasReps && !hasWeight) {
      return "Enter weight for every set that has reps.";
    }
  }
  return null;
}

/** Format load sets for notes (not including existing notes text). */
export function formatLoadSetsForNotes(
  sets: Array<{ weight: string; reps: string }>
): string {
  const valid = parseValidLoadSets(sets);
  const lines = valid.map((s, i) => `Set ${i + 1}: ${s.weight} × ${s.reps}`);
  return lines.length ? `Sets:\n${lines.join("\n")}` : "";
}
