import { redirect } from "next/navigation";

/** Leaderboard content now lives on `/analytics` (Overview tab). */
export default function LeaderboardsPage() {
  redirect("/analytics?view=overview");
}
