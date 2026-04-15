import { redirect } from "next/navigation";

export default function HistoryTablePage() {
  redirect("/training?tab=sessions&view=table");
}
