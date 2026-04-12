-- Drop redundant barbell lift field
ALTER TABLE "workout_templates" DROP COLUMN IF EXISTS "barbellLift";
ALTER TABLE "workout_sessions" DROP COLUMN IF EXISTS "barbellLift";

-- Legacy "Rounds" (round count only) → Rounds + Reps with 0 extra reps (log as N+0)
UPDATE "workout_templates" SET "scoreType" = 'Rounds + Reps' WHERE "scoreType" = 'Rounds';
UPDATE "workout_sessions" SET "scoreType" = 'Rounds + Reps' WHERE "scoreType" = 'Rounds';

UPDATE "workout_sessions"
SET "bestResultDisplay" = trim("bestResultDisplay") || '+0'
WHERE lower(trim("title")) = 'chelsea'
  AND "scoreType" = 'Rounds + Reps'
  AND "bestResultDisplay" IS NOT NULL
  AND trim("bestResultDisplay") ~ '^[0-9]+$';

-- Normalize invalid / empty score types
UPDATE "workout_templates"
SET "scoreType" = 'Time'
WHERE "scoreType" IS NULL
   OR trim("scoreType") = ''
   OR "scoreType" NOT IN ('Time', 'Reps', 'Load', 'Rounds + Reps');

UPDATE "workout_sessions"
SET "scoreType" = 'Time'
WHERE "scoreType" IS NULL
   OR trim("scoreType") = ''
   OR "scoreType" NOT IN ('Time', 'Reps', 'Load', 'Rounds + Reps');

-- Known benchmarks missing types in older imports
UPDATE "workout_templates" SET "scoreType" = 'Time' WHERE lower("title") = 'coe';
UPDATE "workout_templates" SET "scoreType" = 'Time' WHERE lower("title") = 'backcountry';
UPDATE "workout_templates" SET "scoreType" = 'Time' WHERE lower("title") = 'bookends';

UPDATE "workout_sessions" SET "scoreType" = 'Time' WHERE lower("title") = 'coe' AND ("scoreType" IS NULL OR trim("scoreType") = '');
UPDATE "workout_sessions" SET "scoreType" = 'Time' WHERE lower("title") = 'backcountry' AND ("scoreType" IS NULL OR trim("scoreType") = '');
UPDATE "workout_sessions" SET "scoreType" = 'Time' WHERE lower("title") = 'bookends' AND ("scoreType" IS NULL OR trim("scoreType") = '');

-- Load workouts: no scaled option in product model
UPDATE "workout_sessions" SET "rxOrScaled" = NULL WHERE "scoreType" = 'Load';

ALTER TABLE "workout_templates" ALTER COLUMN "scoreType" SET NOT NULL;
ALTER TABLE "workout_sessions" ALTER COLUMN "scoreType" SET NOT NULL;
