-- Speed up per-user date-ordered lookups, PR counts, and template joins
CREATE INDEX "workout_sessions_userId_workoutDate_idx" ON "workout_sessions"("userId", "workoutDate" DESC);
CREATE INDEX "workout_sessions_userId_isPr_idx" ON "workout_sessions"("userId", "isPr");
CREATE INDEX "workout_sessions_workoutTemplateId_idx" ON "workout_sessions"("workoutTemplateId");
