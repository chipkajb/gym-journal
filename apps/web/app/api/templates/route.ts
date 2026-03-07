import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createTemplateSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  scoreType: z.string().optional().nullable(),
  barbellLift: z.string().optional().nullable(),
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
    const template = await prisma.workoutTemplate.create({
      data: {
        userId: session.user.id,
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        scoreType: parsed.data.scoreType ?? null,
        barbellLift: parsed.data.barbellLift ?? null,
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
