import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSessionSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  templateId: z.string().optional().nullable(),
});

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  try {
    const where: { userId: string; startedAt?: { gte?: Date; lte?: Date } } = {
      userId: session.user.id,
    };
    if (from && to) {
      where.startedAt = {
        gte: new Date(from),
        lte: new Date(to),
      };
    }
    const sessions = await prisma.workoutSession.findMany({
      where,
      orderBy: { startedAt: "desc" },
      ...(from && to ? {} : { take: 50 }),
      include: { exerciseLogs: { include: { exercise: true } } },
    });
    return NextResponse.json(sessions);
  } catch (e) {
    console.error("Sessions list error:", e);
    return NextResponse.json(
      { error: "Failed to load sessions" },
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
    const parsed = createSessionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const workoutSession = await prisma.workoutSession.create({
      data: {
        userId: session.user.id,
        name: parsed.data.name,
        category: parsed.data.category,
        workoutTemplateId: parsed.data.templateId ?? null,
        startedAt: new Date(),
      },
    });
    return NextResponse.json(workoutSession);
  } catch (e) {
    console.error("Session create error:", e);
    return NextResponse.json(
      { error: "Failed to start workout" },
      { status: 500 }
    );
  }
}
