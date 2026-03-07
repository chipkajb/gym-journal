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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  try {
    const workoutSession = await prisma.workoutSession.findFirst({
      where: { id, userId: session.user.id },
      include: {
        exerciseLogs: {
          include: { exercise: true },
          orderBy: { orderIndex: "asc" },
        },
      },
    });
    if (!workoutSession) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(workoutSession);
  } catch (e) {
    console.error("Session get error:", e);
    return NextResponse.json(
      { error: "Failed to load session" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const existing = await prisma.workoutSession.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    if (body.completedAt !== undefined) {
      const completedAt = body.completedAt === true ? new Date() : null;
      const duration = completedAt
        ? Math.round(
            (completedAt.getTime() - existing.startedAt.getTime()) / 1000
          )
        : null;
      const updated = await prisma.workoutSession.update({
        where: { id },
        data: { completedAt, duration },
        include: {
          exerciseLogs: { include: { exercise: true }, orderBy: { orderIndex: "asc" } },
        },
      });
      return NextResponse.json(updated);
    }
    return NextResponse.json(existing);
  } catch (e) {
    console.error("Session complete error:", e);
    return NextResponse.json(
      { error: "Failed to update session" },
      { status: 500 }
    );
  }
}
