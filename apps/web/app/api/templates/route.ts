import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SCORE_TYPES } from "@/lib/score-types";
import { z } from "zod";

const scoreTypeEnum = z.enum(SCORE_TYPES);

const createTemplateSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  scoreType: scoreTypeEnum,
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const templates = await prisma.workoutTemplate.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json(templates);
  } catch (e) {
    console.error("Templates list error:", e);
    return NextResponse.json(
      { error: "Failed to load templates" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const parsed = createTemplateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    // Check for duplicate title (case-insensitive)
    const existing = await prisma.workoutTemplate.findFirst({
      where: {
        userId: session.user.id,
        title: { equals: parsed.data.title, mode: "insensitive" },
      },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { error: `A workout named "${parsed.data.title}" already exists.` },
        { status: 409 }
      );
    }

    const template = await prisma.workoutTemplate.create({
      data: {
        userId: session.user.id,
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        scoreType: parsed.data.scoreType,
      },
    });
    return NextResponse.json(template);
  } catch (e) {
    console.error("Template create error:", e);
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}
