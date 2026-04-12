/**
 * Canonical workout score types (strict). Display strings match DB values.
 */
export const SCORE_TYPES = ["Time", "Reps", "Load", "Rounds + Reps"] as const;

export type ScoreType = (typeof SCORE_TYPES)[number];

const SET = new Set<string>(SCORE_TYPES);

export function isValidScoreType(value: string | null | undefined): value is ScoreType {
  return value != null && value !== "" && SET.has(value);
}

export function assertScoreType(value: string | null | undefined): ScoreType {
  if (!isValidScoreType(value)) {
    throw new Error(`Invalid score type: ${value ?? "(empty)"}`);
  }
  return value;
}
