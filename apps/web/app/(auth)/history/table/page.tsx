import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ChevronLeft, Calendar } from "lucide-react";
import { HistoryTableView } from "@/components/features/history/history-table-view";

export default async function HistoryTablePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const sessions = await prisma.workoutSession.findMany({
    where: { userId: session.user.id },
    orderBy: { workoutDate: "desc" },
    take: 500,
    include: { workoutTemplate: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/history"
          className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Back to history"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Workout history — Table view
          </h1>
          <Link
            href="/history"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm"
          >
            <Calendar className="w-4 h-4" />
            Calendar view
          </Link>
        </div>
      </div>

      <HistoryTableView
        sessions={sessions.map((s) => ({
          id: s.id,
          title: s.title,
          workoutDate: s.workoutDate.toISOString(),
          bestResultDisplay: s.bestResultDisplay,
          scoreType: s.scoreType,
          rxOrScaled: s.rxOrScaled,
          isPr: s.isPr,
        }))}
      />
    </div>
  );
}
