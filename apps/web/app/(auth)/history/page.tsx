import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { HistoryCalendar } from "@/components/features/history/history-calendar";

export default async function HistoryPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Workout history
      </h1>
      <p className="text-gray-600 dark:text-gray-400">
        Calendar view of your logged workouts. Click a day to see sessions.
      </p>
      <HistoryCalendar userId={session.user.id} />
    </div>
  );
}
