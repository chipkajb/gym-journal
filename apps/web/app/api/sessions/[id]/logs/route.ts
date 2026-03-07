import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const addLogSchema = z.object({
  exerciseId: z.string(),
  orderIndex: z.number(),
  sets: z.number().optional().nullable(),
  reps: z.number().optional().nullable(),
  weight: z.number().optional().nullable(),
  duration: z.number().optional().nullable(),
  distance: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: sessionId } = await params;
  const existing = await prisma.workoutSession.findFirst({
    where: { id: sessionId, userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  try {
    const body = await request.json();
    const parsed = addLogSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const log = await prisma.exerciseLog.create({
      data: {
        workoutSessionId: sessionId,
        exerciseId: parsed.data.exerciseId,
        orderIndex: parsed.data.orderIndex,
        sets: parsed.data.sets ?? null,
        reps: parsed.data.reps ?? null,
        weight: parsed.data.weight ?? null,
        duration: parsed.data.duration ?? null,
        distance: parsed.data.distance ?? null,
        notes: parsed.data.notes ?? null,
      },
      include: { exercise: true },
    });
    return NextResponse.json(log);
  } catch (e) {
    console.error("Exercise log create error:", e);
    return NextResponse.json(
      { error: "Failed to add log" },
      { status: 500 }
    );
  }
}
