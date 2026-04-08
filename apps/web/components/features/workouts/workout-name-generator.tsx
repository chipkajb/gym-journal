"use client";

import { useState } from "react";
import { Wand2, RotateCcw, Check, Loader2, AlertTriangle } from "lucide-react";

type Props = {
  description?: string;
  scoreType?: string;
  barbellLift?: string;
  existingTitle?: string;
  onSelect: (name: string) => void;
};

export function WorkoutNameGenerator({
  description,
  scoreType,
  barbellLift,
  existingTitle,
  onSelect,
}: Props) {
  const [names, setNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError("");
    setSelected(null);
    try {
      const res = await fetch("/api/generate-name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, scoreType, barbellLift, existingTitle }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to generate names");
        return;
      }
      const data = await res.json();
      setNames(data.names ?? []);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function pick(name: string) {
    setSelected(name);
    onSelect(name);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={generate}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white transition-colors"
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : names.length > 0 ? (
            <RotateCcw className="w-3.5 h-3.5" />
          ) : (
            <Wand2 className="w-3.5 h-3.5" />
          )}
          {loading ? "Generating…" : names.length > 0 ? "Regenerate" : "Generate name"}
        </button>
        {names.length === 0 && !loading && (
          <span className="text-xs text-muted-foreground">AI-powered CrossFit-style names</span>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 px-3 py-2 text-sm text-red-700 dark:text-red-400">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {names.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {names.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => pick(name)}
              className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border transition-all ${
                selected === name
                  ? "border-violet-500 bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 font-semibold"
                  : "border-border bg-card hover:border-violet-400 hover:bg-violet-50/50 dark:hover:bg-violet-950/20 text-foreground"
              }`}
            >
              {selected === name && <Check className="w-3 h-3" />}
              {name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
