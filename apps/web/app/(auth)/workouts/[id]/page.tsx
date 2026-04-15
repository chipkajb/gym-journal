import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ChevronLeft, Flame, Heart, Clock, History } from "lucide-react";
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
    workoutSession.totalDurationSeconds != null;

  const isLoadType = workoutSession.scoreType === "Load";
  // Old records stored "225 x 5" as display; new records store the 1RM directly.
  // Detect old format to show an Est. 1RM line beneath it.
  const isOldLoadFormat =
    isLoadType &&
    workoutSession.bestResultDisplay != null &&
    /^\d+(?:\.\d+)?\s*x\s*\d+$/.test(workoutSession.bestResultDisplay);
  const estimated1RM =
    isOldLoadFormat && workoutSession.bestResultRaw != null
      ? roundOneRepMax(workoutSession.bestResultRaw)
      : null;
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/training?tab=sessions"
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
              {isLoadType && !isOldLoadFormat ? "Est. 1RM" : "Result"}
            </span>
            <p className="text-2xl font-bold text-foreground mt-0.5">
              {workoutSession.bestResultDisplay}
              {isLoadType && !isOldLoadFormat && (
                <span className="text-base font-normal text-muted-foreground ml-1">
                  lbs/kg
                </span>
              )}
            </p>
            {/* Old records: show computed 1RM below the "225 x 5" display */}
            {estimated1RM != null && (
              <p className="text-sm text-muted-foreground mt-0.5">
                Est. 1RM:{" "}
                <span className="font-semibold text-foreground">
                  {estimated1RM} lbs/kg
                </span>
              </p>
            )}
            {(() => {
              const sd = workoutSession.setDetails as {
                sets?: { weight: number; reps: number }[];
                weight?: number;
                reps?: number;
              } | null;
              if (!isLoadType || !sd) return null;
              if (Array.isArray(sd.sets) && sd.sets.length > 0) {
                return (
                  <ul className="text-sm text-muted-foreground mt-0.5 list-disc pl-4 space-y-0.5">
                    {sd.sets.map((s, i) => (
                      <li key={i}>
                        Set {i + 1}: {s.weight} lbs/kg × {s.reps}{" "}
                        {s.reps === 1 ? "rep" : "reps"}
                      </li>
                    ))}
                  </ul>
                );
              }
              if (typeof sd.weight === "number" && typeof sd.reps === "number") {
                return (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Lift: {sd.weight} lbs/kg × {sd.reps}{" "}
                    {sd.reps === 1 ? "rep" : "reps"}
                  </p>
                );
              }
              return null;
            })()}
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
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-950/30">
                <Flame className="w-4 h-4 text-orange-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Calories</p>
                {workoutSession.calories != null ? (
                  <>
                    <p className="text-lg font-bold text-foreground">{workoutSession.calories}</p>
                    <p className="text-xs text-muted-foreground">kcal</p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground mt-0.5">—</p>
                )}
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                <Clock className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total time training</p>
                {workoutSession.totalDurationSeconds != null ? (
                  <p className="text-lg font-bold text-foreground">
                    {formatDuration(workoutSession.totalDurationSeconds)}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground mt-0.5">—</p>
                )}
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-pink-50 dark:bg-pink-950/30">
                <Heart className="w-4 h-4 text-pink-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg HR</p>
                {workoutSession.avgHeartRate != null ? (
                  <>
                    <p className="text-lg font-bold text-foreground">{workoutSession.avgHeartRate}</p>
                    <p className="text-xs text-muted-foreground">bpm</p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground mt-0.5">—</p>
                )}
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/30">
                <Heart className="w-4 h-4 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Max HR</p>
                {workoutSession.maxHeartRate != null ? (
                  <>
                    <p className="text-lg font-bold text-foreground">{workoutSession.maxHeartRate}</p>
                    <p className="text-xs text-muted-foreground">bpm</p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground mt-0.5">—</p>
                )}
              </div>
            </div>
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
