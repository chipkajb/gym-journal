-- Remove in-app timer column (timer result is no longer stored separately)
ALTER TABLE "workout_sessions" DROP COLUMN "timedDurationSeconds";
