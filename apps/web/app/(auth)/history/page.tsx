import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { HistoryCalendar } from "@/components/features/history/history-calendar";
import { List } from "lucide-react";

export default async function HistoryPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Workout history
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Calendar view of your logged workouts. Click a day to see sessions.
          </p>
        </div>
        <Link
          href="/history/table"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <List className="w-4 h-4" />
          Table view
        </Link>
      </div>
      <HistoryCalendar userId={session.user.id} />
    </div>
  );
}
