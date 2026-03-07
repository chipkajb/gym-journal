import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ChevronLeft, LayoutGrid } from "lucide-react";
import { LibraryTableView } from "@/components/features/library/library-table-view";

export default async function LibraryTablePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const templates = await prisma.workoutTemplate.findMany({
    where: { userId: session.user.id },
    orderBy: { title: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/library"
          className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Back to library"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Workout Library — Table view
          </h1>
          <Link
            href="/library"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm"
          >
            <LayoutGrid className="w-4 h-4" />
            Card view
          </Link>
        </div>
      </div>

      <LibraryTableView
        templates={templates.map((t) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          scoreType: t.scoreType,
          barbellLift: t.barbellLift,
        }))}
      />
    </div>
  );
}
