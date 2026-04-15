import { redirect } from "next/navigation";

type Search = { view?: string | string[] };

export default async function WorkoutsIndexPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const q = await searchParams;
  const raw = typeof q.view === "string" ? q.view : Array.isArray(q.view) ? q.view[0] : undefined;
  const view = raw === "calendar" || raw === "table" ? raw : undefined;
  const params = new URLSearchParams();
  params.set("tab", "sessions");
  if (view) params.set("view", view);
  redirect(`/training?${params.toString()}`);
}
