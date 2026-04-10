import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { SessionsEditor } from "./sessions-editor";

export default async function HistoryEditPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const sessions = await prisma.workoutSession.findMany({
    where: { userId: session.user.id },
    orderBy: { workoutDate: "desc" },
    select: {
      id: true,
      title: true,
      workoutDate: true,
      bestResultDisplay: true,
      scoreType: true,
      rxOrScaled: true,
      isPr: true,
      notes: true,
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Link
          href="/history"
          className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Back to history"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Edit workout history
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-0.5">
            Edit any field inline. Click &ldquo;Save changes&rdquo; to apply your edits.
          </p>
        </div>
      </div>

      <SessionsEditor
        sessions={sessions.map((s) => ({
          id: s.id,
          title: s.title,
          workoutDate: s.workoutDate.toISOString(),
          bestResultDisplay: s.bestResultDisplay,
          scoreType: s.scoreType,
          rxOrScaled: s.rxOrScaled,
          isPr: s.isPr,
          notes: s.notes,
        }))}
      />
    </div>
  );
}
