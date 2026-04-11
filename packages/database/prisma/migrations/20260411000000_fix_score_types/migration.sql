-- Fix score types: convert "Other" and "Text" scoreType to "Load" for tempo-style lifts
-- These are barbell strength/tempo workouts that were previously miscategorized.
UPDATE "workout_templates"
SET "scoreType" = 'Load'
WHERE "scoreType" IN ('Other', 'Text');

UPDATE "workout_sessions"
SET "scoreType" = 'Load'
WHERE "scoreType" IN ('Other', 'Text');

-- Fill in missing scoreType for known CrossFit Girl WODs (Time)
UPDATE "workout_templates"
SET "scoreType" = 'Time'
WHERE "scoreType" IS NULL
  AND "title" IN (
    'Angie', 'Barbara', 'Diane', 'Elizabeth', 'Fran', 'Grace',
    'Helen', 'Isabel', 'Jackie', 'Karen', 'Kelly', 'Linda', 'Nancy',
    'Annie', 'Amanda', 'Nasty Girls', 'Eva'
  );

-- Fill in missing scoreType for known Hero WODs (Time)
UPDATE "workout_templates"
SET "scoreType" = 'Time'
WHERE "scoreType" IS NULL
  AND "title" IN (
    'Murph', 'DT', 'JT', 'Randy', 'Ryan', 'Holleyman',
    'Filthy Fifty', 'The Seven', 'Josh'
  );

-- Fill in missing scoreType for known AMRAP WODs (Rounds + Reps)
UPDATE "workout_templates"
SET "scoreType" = 'Rounds + Reps'
WHERE "scoreType" IS NULL
  AND "title" IN ('Cindy', 'Mary', 'Nate');

-- Fill in missing scoreType for Chelsea (Rounds EMOM)
UPDATE "workout_templates"
SET "scoreType" = 'Rounds'
WHERE "scoreType" IS NULL
  AND "title" = 'Chelsea';

-- Fill in missing scoreType for known Reps WODs
UPDATE "workout_templates"
SET "scoreType" = 'Reps'
WHERE "scoreType" IS NULL
  AND "title" IN ('Fight Gone Bad', 'Tabata Something Else', 'Lynne', 'Nicole');

-- Fill in missing scoreType for Max Lift templates (Load)
UPDATE "workout_templates"
SET "scoreType" = 'Load'
WHERE "scoreType" IS NULL
  AND "title" IN (
    'Max Back Squat', 'Max Front Squat', 'Max Deadlift',
    'Max Clean & Jerk', 'Max Snatch', 'Max Overhead Press',
    'Max Push Press', 'Max Clean', 'Max Bench Press', 'Max Thruster'
  );

-- Infer scoreType from description for any remaining NULL templates
-- "for time" patterns → Time
UPDATE "workout_templates"
SET "scoreType" = 'Time'
WHERE "scoreType" IS NULL
  AND (
    "description" ILIKE '%for time%'
    OR "description" ILIKE '%rounds for time%'
    OR "description" ILIKE '% time:%'
  );

-- AMRAP patterns → Rounds + Reps
UPDATE "workout_templates"
SET "scoreType" = 'Rounds + Reps'
WHERE "scoreType" IS NULL
  AND (
    "description" ILIKE '%amrap%'
    OR "description" ILIKE '%as many rounds%'
  );

-- 1RM / Max lift patterns → Load
UPDATE "workout_templates"
SET "scoreType" = 'Load'
WHERE "scoreType" IS NULL
  AND (
    "description" ILIKE '%1-rep max%'
    OR "description" ILIKE '%1rm%'
    OR "description" ILIKE '%find your%max%'
    OR "description" ILIKE '%work up to a heavy single%'
  );
