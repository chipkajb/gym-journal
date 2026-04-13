import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Plus, BookOpen, List, LayoutGrid } from "lucide-react";
import { LibraryCardGrid } from "@/components/features/library/library-card-grid";

export default async function LibraryPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const templates = await prisma.workoutTemplate.findMany({
    where: { userId: session.user.id },
    include: {
      workoutSessions: {
        where: { userId: session.user.id },
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
      },
    },
    orderBy: { title: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Workout Library
        </h1>
        <div className="flex gap-2">
          <Link
            href="/library/table"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <List className="w-4 h-4" />
            Table view
          </Link>
          <Link
            href="/library/templates/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            New template
          </Link>
        </div>
      </div>

      {templates.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-12 text-center">
          <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            No workout templates yet. Create one or import from CSV.
          </p>
          <Link
            href="/library/templates/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Create template
          </Link>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <LayoutGrid className="w-4 h-4" />
            Card view
          </div>
          <LibraryCardGrid
            templates={templates.map((t) => ({
              id: t.id,
              title: t.title,
              scoreType: t.scoreType,
              sessions: t.workoutSessions.map((s) => ({
                id: s.id,
                workoutDate: s.workoutDate.toISOString(),
                bestResultDisplay: s.bestResultDisplay,
                bestResultRaw: s.bestResultRaw,
                rxOrScaled: s.rxOrScaled,
                isPr: s.isPr,
                scoreType: s.scoreType,
                notes: s.notes,
              })),
            }))}
          />
        </>
      )}
    </div>
  );
}
