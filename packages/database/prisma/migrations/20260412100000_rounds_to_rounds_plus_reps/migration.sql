-- Rounds-only scores become "Rounds + Reps" with 0 additional reps (e.g. Chelsea round count as 7+0).

-- Any legacy Rounds score type still in the DB
UPDATE "workout_templates"
SET "scoreType" = 'Rounds + Reps'
WHERE "scoreType" = 'Rounds';

UPDATE "workout_sessions"
SET "scoreType" = 'Rounds + Reps'
WHERE "scoreType" = 'Rounds';

-- Chelsea was migrated to Reps in 20260411120000; move to Rounds + Reps
UPDATE "workout_templates"
SET "scoreType" = 'Rounds + Reps'
WHERE lower(trim("title")) = 'chelsea' AND "scoreType" = 'Reps';

UPDATE "workout_sessions"
SET "scoreType" = 'Rounds + Reps'
WHERE lower(trim("title")) = 'chelsea' AND "scoreType" = 'Reps';

-- Plain integer display → N+0 for Chelsea (Rounds + Reps format)
UPDATE "workout_sessions"
SET "bestResultDisplay" = trim("bestResultDisplay") || '+0'
WHERE lower(trim("title")) = 'chelsea'
  AND "scoreType" = 'Rounds + Reps'
  AND "bestResultDisplay" IS NOT NULL
  AND trim("bestResultDisplay") ~ '^[0-9]+$';
