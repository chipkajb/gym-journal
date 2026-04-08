import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";
import { APIError } from "@anthropic-ai/sdk";
import { z } from "zod";

const requestSchema = z.object({
  description: z.string().optional().nullable(),
  scoreType: z.string().optional().nullable(),
  barbellLift: z.string().optional().nullable(),
  existingTitle: z.string().optional().nullable(),
});

// System prompt for the CrossFit WOD naming agent
const SYSTEM_PROMPT = `You are a CrossFit WOD (Workout of the Day) naming expert. Your job is to generate creative, memorable, and evocative names for custom CrossFit-style workouts.

## Naming Conventions to Follow

**Person Names (Hero/Girl WODs style):**
- Classic CrossFit uses first names like "Fran", "Cindy", "Helen", "Grace" for benchmark WODs
- Hero WODs use last names or full names of fallen soldiers/heroes (e.g., "Murph", "DT", "JT")
- Use short, punchy first names — preferably 1-2 syllables
- Mix male and female names naturally

**Thematic/Descriptive Names:**
- Names that evoke intensity, challenge, or the feeling of the workout
- Can reference nature, mythology, military terms, or physical concepts
- Examples: "Terminator", "Thunder", "Inferno", "Avalanche", "Ironclad"

**Code Names / Callsigns:**
- Military-style callsigns or operation names
- Short, aggressive-sounding words

## Rules
- Generate exactly 6 unique name suggestions
- Names should be 1-3 words maximum
- Names must NOT be generic descriptions of the workout (e.g., don't say "Heavy Deadlift Day")
- Names should feel like official CrossFit benchmark names
- Consider the workout's intensity, movement patterns, and character when naming
- Return ONLY a JSON array of strings, no explanation, no markdown, no extra text

## Format
Return exactly this format (pure JSON array, nothing else):
["Name1", "Name2", "Name3", "Name4", "Name5", "Name6"]`;

function buildUserMessage(data: {
  description?: string | null;
  scoreType?: string | null;
  barbellLift?: string | null;
  existingTitle?: string | null;
}): string {
  const parts: string[] = [];

  if (data.existingTitle) {
    parts.push(`Current name: ${data.existingTitle}`);
  }
  if (data.scoreType) {
    parts.push(`Score type: ${data.scoreType}`);
  }
  if (data.barbellLift) {
    parts.push(`Barbell lift: ${data.barbellLift}`);
  }
  if (data.description) {
    parts.push(`Workout description:\n${data.description}`);
  }

  if (parts.length === 0) {
    parts.push("Generic CrossFit-style metcon workout");
  }

  return `Generate 6 creative CrossFit-style WOD names for this workout:\n\n${parts.join("\n")}`;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Name generator not configured (missing ANTHROPIC_API_KEY)" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const client = new Anthropic({ apiKey });
    const userMessage = buildUserMessage(parsed.data);

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Parse the JSON array response
    const names = JSON.parse(text.trim());
    if (!Array.isArray(names) || names.length === 0) {
      throw new Error("Invalid response format");
    }

    return NextResponse.json({ names: names.slice(0, 6) });
  } catch (e) {
    console.error("Name generation error:", e);

    if (e instanceof APIError) {
      if (e.status === 401) {
        return NextResponse.json(
          { error: "Invalid Anthropic API key — check your ANTHROPIC_API_KEY environment variable" },
          { status: 502 }
        );
      }
      if (e.status === 429) {
        return NextResponse.json(
          { error: "Claude API rate limit reached — please wait a moment and try again" },
          { status: 429 }
        );
      }
      if (e.status === 529 || e.status === 503) {
        return NextResponse.json(
          { error: "Claude API is temporarily overloaded — please try again in a few seconds" },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { error: `Claude API error (${e.status}): ${e.message}` },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { error: "Failed to generate names — unexpected error" },
      { status: 500 }
    );
  }
}
