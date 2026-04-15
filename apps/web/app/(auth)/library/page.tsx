import { redirect } from "next/navigation";

export default function LibraryIndexPage() {
  redirect("/training?tab=library");
}
