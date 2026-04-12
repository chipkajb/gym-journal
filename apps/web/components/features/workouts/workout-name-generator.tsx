"use client";

import { useState } from "react";
import { Copy, Check, AlertTriangle } from "lucide-react";

type Props = {
  description?: string;
  scoreType?: string;
  existingTitle?: string;
  onSelect: (name: string) => void;
};

function buildPrompt(data: {
  description?: string;
  scoreType?: string;
  existingTitle?: string;
}): string {
  const workoutDetails: string[] = [];

  if (data.existingTitle) {
    workoutDetails.push(`Current working title: ${data.existingTitle}`);
  }
  if (data.scoreType) {
    workoutDetails.push(`Score type: ${data.scoreType}`);
  }
  if (data.description) {
    workoutDetails.push(`Workout description:\n${data.description}`);
  }

  const workoutSection =
    workoutDetails.length > 0
      ? workoutDetails.join("\n")
      : "Generic CrossFit-style metcon (no additional details provided)";

  return `You are a CrossFit WOD naming expert. I need you to generate 6 creative, memorable names for my custom CrossFit-style workout.

## Workout Details
${workoutSection}

## Naming Style Guidelines
CrossFit workouts traditionally follow a few naming conventions — apply whichever fits best:

- **Person names (Girl/Hero WOD style):** Short, punchy first names like "Fran", "Cindy", "Helen", "Grace", or last names for hero WODs like "Murph", "DT", "JT". Prefer 1–2 syllables.
- **Thematic names:** Evoke the intensity, feeling, or character of the workout — nature, mythology, military terms, physical concepts. Examples: "Inferno", "Avalanche", "Ironclad", "Thunder", "Tempest".
- **Callsigns / operation names:** Military-style, aggressive-sounding short words or phrases.

## Constraints
- Exactly 6 unique name suggestions
- Each name must be 1–3 words maximum
- Do NOT use generic descriptions of the workout (e.g., avoid "Heavy Deadlift Day" or "Long Run Workout")
- Names should feel like they belong in the official CrossFit benchmark library
- Draw on the workout's movement patterns, scoring style, and overall intensity

## Output Format
Return a numbered list of 6 names. After each name, include one concise sentence explaining why it fits this workout's character.`;
}

async function copyToClipboard(text: string): Promise<void> {
  // Modern async clipboard API (works on desktop and iOS 13.4+)
  if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    await navigator.clipboard.writeText(text);
    return;
  }

  // Fallback for older browsers / restricted contexts
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.top = "0";
  textarea.style.left = "0";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  const success = document.execCommand("copy");
  document.body.removeChild(textarea);
  if (!success) {
    throw new Error("Copy command failed");
  }
}

export function WorkoutNameGenerator({
  description,
  scoreType,
  existingTitle,
  onSelect: _onSelect,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  async function handleCopy() {
    setError("");
    const prompt = buildPrompt({ description, scoreType, existingTitle });
    try {
      await copyToClipboard(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      setError("Could not copy to clipboard — try long-pressing and copying the text manually.");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white transition-colors"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
          {copied ? "Prompt copied!" : "Copy naming prompt"}
        </button>
        {!copied && (
          <span className="text-xs text-muted-foreground">Paste into Claude.ai to get name ideas</span>
        )}
        {copied && (
          <span className="text-xs text-violet-600 dark:text-violet-400 font-medium">
            Paste into claude.ai/new to generate names
          </span>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 px-3 py-2 text-sm text-red-700 dark:text-red-400">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
