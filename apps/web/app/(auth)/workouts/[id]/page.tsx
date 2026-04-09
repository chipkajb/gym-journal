import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ChevronLeft, Flame, Heart, Clock, Timer, History } from "lucide-react";
import { format } from "date-fns";
import { WorkoutSessionActions } from "@/components/features/workouts/workout-session-actions";
import { WorkoutHistoryPanel } from "@/components/features/workouts/workout-history-panel";
import { roundOneRepMax } from "@/lib/workout-utils";

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (s === 0) return `${m}m`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default async function WorkoutSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const { id } = await params;
  const workoutSession = await prisma.workoutSession.findFirst({
    where: { id, userId: session.user.id },
    include: { workoutTemplate: true },
  });

  if (!workoutSession) notFound();

  // Fetch related history (other sessions of the same workout)
  const relatedSessions = workoutSession.workoutTemplateId
    ? await prisma.workoutSession.findMany({
        where: {
          userId: session.user.id,
          workoutTemplateId: workoutSession.workoutTemplateId,
          NOT: { id },
        },
        orderBy: { workoutDate: "desc" },
        select: {
          id: true,
          workoutDate: true,
          bestResultDisplay: true,
          bestResultRaw: true,
          rxOrScaled: true,
          isPr: true,
          scoreType: true,
          notes: true,
        },
      })
    : [];

  const hasHealthMetrics =
    workoutSession.calories != null ||
    workoutSession.maxHeartRate != null ||
    workoutSession.avgHeartRate != null ||
    workoutSession.totalDurationSeconds != null ||
    workoutSession.timedDurationSeconds != null;

  const isLoadType = workoutSession.scoreType === "Load";
  const estimated1RM =
    isLoadType && workoutSession.bestResultRaw != null
      ? roundOneRepMax(workoutSession.bestResultRaw)
      : null;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/workouts"
            className="p-2 rounded-lg text-muted-foreground hover:bg-accent transition-colors"
            aria-label="Back to workouts"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {workoutSession.title}
            </h1>
            <p className="text-sm text-muted-foreground">
              {format(new Date(workoutSession.workoutDate), "MMMM d, yyyy")}
              {workoutSession.rxOrScaled && ` · ${workoutSession.rxOrScaled}`}
              {workoutSession.isPr && " · 🏆 PR"}
            </p>
          </div>
        </div>
        <WorkoutSessionActions sessionId={workoutSession.id} />
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        {workoutSession.bestResultDisplay && (
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Result
            </span>
            <p className="text-2xl font-bold text-foreground mt-0.5">
              {workoutSession.bestResultDisplay}
            </p>
            {estimated1RM != null && (
              <p className="text-sm text-muted-foreground mt-0.5">
                Estimated 1RM (Epley):{" "}
                <span className="font-semibold text-foreground">
                  ~{estimated1RM} lbs/kg
                </span>
              </p>
            )}
          </div>
        )}
        {workoutSession.scoreType && (
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Score type
            </span>
            <p className="text-foreground mt-0.5">{workoutSession.scoreType}</p>
          </div>
        )}
        {workoutSession.description && (
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Description
            </span>
            <p className="text-foreground whitespace-pre-wrap mt-0.5">
              {workoutSession.description}
            </p>
          </div>
        )}
        {workoutSession.barbellLift && (
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Barbell lift
            </span>
            <p className="text-foreground mt-0.5">{workoutSession.barbellLift}</p>
          </div>
        )}
        {workoutSession.notes && (
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Notes
            </span>
            <p className="text-foreground whitespace-pre-wrap mt-0.5">
              {workoutSession.notes}
            </p>
          </div>
        )}
      </div>

      {hasHealthMetrics && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Health &amp; Performance
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {workoutSession.calories != null && (
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-950/30">
                  <Flame className="w-4 h-4 text-orange-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Calories</p>
                  <p className="text-lg font-bold text-foreground">
                    {workoutSession.calories}
                  </p>
                  <p className="text-xs text-muted-foreground">kcal</p>
                </div>
              </div>
            )}
            {workoutSession.maxHeartRate != null && (
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/30">
                  <Heart className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Max HR</p>
                  <p className="text-lg font-bold text-foreground">
                    {workoutSession.maxHeartRate}
                  </p>
                  <p className="text-xs text-muted-foreground">bpm</p>
                </div>
              </div>
            )}
            {workoutSession.avgHeartRate != null && (
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-pink-50 dark:bg-pink-950/30">
                  <Heart className="w-4 h-4 text-pink-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Avg HR</p>
                  <p className="text-lg font-bold text-foreground">
                    {workoutSession.avgHeartRate}
                  </p>
                  <p className="text-xs text-muted-foreground">bpm</p>
                </div>
              </div>
            )}
            {workoutSession.totalDurationSeconds != null && (
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                  <Clock className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total time</p>
                  <p className="text-lg font-bold text-foreground">
                    {formatDuration(workoutSession.totalDurationSeconds)}
                  </p>
                  <p className="text-xs text-muted-foreground">incl. warmup</p>
                </div>
              </div>
            )}
            {workoutSession.timedDurationSeconds != null && (
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-violet-50 dark:bg-violet-950/30">
                  <Timer className="w-4 h-4 text-violet-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Timer result</p>
                  <p className="text-lg font-bold text-foreground">
                    {formatDuration(workoutSession.timedDurationSeconds)}
                  </p>
                  <p className="text-xs text-muted-foreground">in-app timer</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Related session history */}
      {relatedSessions.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              History — {workoutSession.title}
            </h2>
          </div>
          <WorkoutHistoryPanel
            sessions={relatedSessions.map((s) => ({
              id: s.id,
              workoutDate: s.workoutDate.toISOString(),
              bestResultDisplay: s.bestResultDisplay,
              bestResultRaw: s.bestResultRaw,
              rxOrScaled: s.rxOrScaled,
              isPr: s.isPr,
              scoreType: s.scoreType,
              notes: s.notes,
            }))}
          />
        </div>
      )}
    </div>
  );
}
