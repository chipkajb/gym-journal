-- Add health & performance metrics to workout_sessions
ALTER TABLE "workout_sessions" ADD COLUMN "calories" INTEGER;
ALTER TABLE "workout_sessions" ADD COLUMN "maxHeartRate" INTEGER;
ALTER TABLE "workout_sessions" ADD COLUMN "avgHeartRate" INTEGER;
ALTER TABLE "workout_sessions" ADD COLUMN "totalDurationSeconds" INTEGER;
ALTER TABLE "workout_sessions" ADD COLUMN "timedDurationSeconds" INTEGER;
