import { redirect } from "next/navigation";

export default function WodPage() {
  redirect("/training?tab=wod");
}
