import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSessionSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  workoutDate: z.string().optional(),
  bestResultRaw: z.number().optional().nullable(),
  bestResultDisplay: z.string().optional().nullable(),
  scoreType: z.string().optional().nullable(),
  barbellLift: z.string().optional().nullable(),
  setDetails: z.unknown().optional().nullable(),
  notes: z.string().optional().nullable(),
  rxOrScaled: z.string().optional().nullable(),
  isPr: z.boolean().optional(),
  // Health metrics
  calories: z.number().int().optional().nullable(),
  maxHeartRate: z.number().int().optional().nullable(),
  avgHeartRate: z.number().int().optional().nullable(),
  totalDurationSeconds: z.number().int().optional().nullable(),
  timedDurationSeconds: z.number().int().optional().nullable(),
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
      include: { workoutTemplate: true },
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
    const parsed = updateSessionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const data = parsed.data;
    const updated = await prisma.workoutSession.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.workoutDate !== undefined && {
          workoutDate: new Date(data.workoutDate),
        }),
        ...(data.bestResultRaw !== undefined && { bestResultRaw: data.bestResultRaw }),
        ...(data.bestResultDisplay !== undefined && {
          bestResultDisplay: data.bestResultDisplay,
        }),
        ...(data.scoreType !== undefined && { scoreType: data.scoreType }),
        ...(data.barbellLift !== undefined && { barbellLift: data.barbellLift }),
        ...(data.setDetails !== undefined && {
          setDetails:
            data.setDetails === null
              ? Prisma.JsonNull
              : (data.setDetails as object),
        }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.rxOrScaled !== undefined && { rxOrScaled: data.rxOrScaled }),
        ...(data.isPr !== undefined && { isPr: data.isPr }),
        ...(data.calories !== undefined && { calories: data.calories }),
        ...(data.maxHeartRate !== undefined && { maxHeartRate: data.maxHeartRate }),
        ...(data.avgHeartRate !== undefined && { avgHeartRate: data.avgHeartRate }),
        ...(data.totalDurationSeconds !== undefined && { totalDurationSeconds: data.totalDurationSeconds }),
        ...(data.timedDurationSeconds !== undefined && { timedDurationSeconds: data.timedDurationSeconds }),
      },
      include: { workoutTemplate: true },
    });
    return NextResponse.json(updated);
  } catch (e) {
    console.error("Session update error:", e);
    return NextResponse.json(
      { error: "Failed to update session" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  try {
    const existing = await prisma.workoutSession.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    await prisma.workoutSession.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Session delete error:", e);
    return NextResponse.json(
      { error: "Failed to delete session" },
      { status: 500 }
    );
  }
}
