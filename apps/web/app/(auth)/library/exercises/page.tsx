import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function ExercisesPage() {
  const exercises = await prisma.exercise.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  const byCategory = exercises.reduce<Record<string, typeof exercises>>(
    (acc, ex) => {
      if (!acc[ex.category]) acc[ex.category] = [];
      acc[ex.category].push(ex);
      return acc;
    },
    {}
  );

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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Exercise library
        </h1>
      </div>

      <p className="text-gray-600 dark:text-gray-400">
        Built-in exercises you can add to workout templates. Run{" "}
        <code className="rounded bg-gray-200 dark:bg-gray-700 px-1 py-0.5 text-sm">
          npm run db:seed
        </code>{" "}
        to add more.
      </p>

      <div className="space-y-6">
        {Object.entries(byCategory).map(([category, list]) => (
          <section key={category}>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              {category}
            </h2>
            <ul className="rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700 overflow-hidden bg-white dark:bg-gray-800">
              {list.map((ex) => (
                <li
                  key={ex.id}
                  className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {ex.name}
                    </p>
                    {ex.muscleGroup && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {ex.muscleGroup}
                        {ex.equipment ? ` · ${ex.equipment}` : ""}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
