import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Plus, BookOpen, List, LayoutGrid, PenLine } from "lucide-react";

export default async function LibraryPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const templates = await prisma.workoutTemplate.findMany({
    where: { userId: session.user.id },
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
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((t) => (
              <li key={t.id}>
                <div className="flex flex-col h-full p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <div className="flex-1">
                    <h2 className="font-semibold text-gray-900 dark:text-white">
                      {t.title}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {t.scoreType || "—"}
                      {t.barbellLift && ` · ${t.barbellLift}`}
                    </p>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Link
                      href={`/library/templates/${t.id}/edit`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
                    >
                      <PenLine className="w-3.5 h-3.5" />
                      Edit
                    </Link>
                    <Link
                      href={`/workouts/new?templateId=${t.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm"
                    >
                      Log workout
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
