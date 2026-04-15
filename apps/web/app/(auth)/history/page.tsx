import { redirect } from "next/navigation";

export default function HistoryPage() {
  redirect("/training?tab=sessions&view=calendar");
}
