import { redirect } from "next/navigation";

export default function HistoryTablePage() {
  redirect("/workouts?view=table");
}
