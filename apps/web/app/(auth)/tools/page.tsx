import { Suspense } from "react";
import { ToolsHubClient } from "@/components/features/tools/tools-hub-client";

export default function ToolsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
      <ToolsHubClient />
    </Suspense>
  );
}
