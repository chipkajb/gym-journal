-- Clear workout-related data (preserve users and other data)
DELETE FROM "exercise_logs";
DELETE FROM "workout_sessions";
DELETE FROM "template_exercises";
DELETE FROM "workout_templates";

-- Drop removed tables
DROP TABLE "exercise_logs";
DROP TABLE "template_exercises";

-- Alter workout_templates: rename name -> title, drop category/tags/isPublic, add scoreType/barbellLift
ALTER TABLE "workout_templates" RENAME COLUMN "name" TO "title";
ALTER TABLE "workout_templates" DROP COLUMN "category";
ALTER TABLE "workout_templates" DROP COLUMN "tags";
ALTER TABLE "workout_templates" DROP COLUMN "isPublic";
ALTER TABLE "workout_templates" ADD COLUMN "scoreType" TEXT;
ALTER TABLE "workout_templates" ADD COLUMN "barbellLift" TEXT;

-- Alter workout_sessions: add new columns then drop old
ALTER TABLE "workout_sessions" ADD COLUMN "title" TEXT;
ALTER TABLE "workout_sessions" ADD COLUMN "description" TEXT;
ALTER TABLE "workout_sessions" ADD COLUMN "workoutDate" TIMESTAMP(3);
ALTER TABLE "workout_sessions" ADD COLUMN "bestResultRaw" DOUBLE PRECISION;
ALTER TABLE "workout_sessions" ADD COLUMN "bestResultDisplay" TEXT;
ALTER TABLE "workout_sessions" ADD COLUMN "scoreType" TEXT;
ALTER TABLE "workout_sessions" ADD COLUMN "barbellLift" TEXT;
ALTER TABLE "workout_sessions" ADD COLUMN "setDetails" JSONB;
ALTER TABLE "workout_sessions" ADD COLUMN "rxOrScaled" TEXT;
ALTER TABLE "workout_sessions" ADD COLUMN "isPr" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "workout_sessions" DROP COLUMN "name";
ALTER TABLE "workout_sessions" DROP COLUMN "category";
ALTER TABLE "workout_sessions" DROP COLUMN "startedAt";
ALTER TABLE "workout_sessions" DROP COLUMN "completedAt";
ALTER TABLE "workout_sessions" DROP COLUMN "duration";

-- Make new required columns non-null (table is empty so safe)
ALTER TABLE "workout_sessions" ALTER COLUMN "title" SET NOT NULL;
ALTER TABLE "workout_sessions" ALTER COLUMN "workoutDate" SET NOT NULL;
