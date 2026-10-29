"use client";

import { HubHeader, useTabParam, type HubTab } from "@/components/ui/hub-tabs";
import { Calculator, Timer } from "lucide-react";
import { TimerToolPanel } from "@/components/features/tools/timer-tool-panel";
import { OneRepMaxClient } from "@/app/(auth)/tools/1rm/one-rep-max-client";

const TOOLS_TABS = [
  { id: "timer", label: "Timer", icon: Timer },
  { id: "1rm", label: "1RM estimate", icon: Calculator },
] as const satisfies readonly HubTab<string>[];

export function ToolsHubClient() {
  const [tab, setTab] = useTabParam("tab", TOOLS_TABS);

  return (
    <div className="space-y-6">
      <HubHeader title="Tools" label="Tools" idPrefix="tab-tools" tabs={TOOLS_TABS} active={tab} onSelect={setTab} />

      <div role="tabpanel" id="tab-tools-panel" aria-labelledby={`tab-tools-${tab}`}>
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
