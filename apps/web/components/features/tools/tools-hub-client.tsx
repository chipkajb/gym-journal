"use client";

import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Calculator, Timer } from "lucide-react";
import { TimerToolPanel } from "@/components/features/tools/timer-tool-panel";
import { OneRepMaxClient } from "@/app/(auth)/tools/1rm/one-rep-max-client";

type ToolsTab = "timer" | "1rm";

function parseTab(raw: string | null): ToolsTab {
  if (raw === "1rm") return "1rm";
  return "timer";
}

export function ToolsHubClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = useMemo(() => parseTab(searchParams.get("tab")), [searchParams]);

  const setTab = useCallback(
    (next: ToolsTab) => {
      const qs = new URLSearchParams(searchParams.toString());
      if (next === "timer") qs.delete("tab");
      else qs.set("tab", next);
      const tail = qs.toString();
      router.replace(tail ? `/tools?${tail}` : "/tools", { scroll: false });
    },
    [router, searchParams]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Tools</h1>
      </div>

      <div
        role="tablist"
        aria-label="Tools"
        className="flex flex-nowrap gap-1 sm:gap-2 overflow-x-auto border-b border-border pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <button
          id="tab-tools-timer"
          type="button"
          role="tab"
          aria-selected={tab === "timer"}
          onClick={() => setTab("timer")}
          className={`inline-flex shrink-0 items-center gap-1 sm:gap-2 rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium border transition-colors whitespace-nowrap ${
            tab === "timer"
              ? "border-primary bg-primary text-primary-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground hover:bg-accent"
          }`}
        >
          <Timer className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          Timer
        </button>
        <button
          id="tab-tools-1rm"
          type="button"
          role="tab"
          aria-selected={tab === "1rm"}
          onClick={() => setTab("1rm")}
          className={`inline-flex shrink-0 items-center gap-1 sm:gap-2 rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium border transition-colors whitespace-nowrap ${
            tab === "1rm"
              ? "border-primary bg-primary text-primary-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground hover:bg-accent"
          }`}
        >
          <Calculator className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          1RM estimate
        </button>
      </div>

      <div role="tabpanel" aria-labelledby={tab === "timer" ? "tab-tools-timer" : "tab-tools-1rm"}>
        {tab === "timer" && <TimerToolPanel headingLevel="section" />}
        {tab === "1rm" && (
          <div className="space-y-4 max-w-xl">
            <div>
              <h2 className="text-xl font-bold text-foreground">1-Rep Max Calculator</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Estimate your max lift from any sub-maximal effort using Epley&apos;s formula.
              </p>
            </div>
            <OneRepMaxClient />
          </div>
        )}
      </div>
    </div>
  );
}
