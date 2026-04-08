import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSessionSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  workoutDate: z.string().optional(), // ISO date or YYYY-MM-DD; default today
  bestResultRaw: z.number().optional().nullable(),
  bestResultDisplay: z.string().optional().nullable(),
  scoreType: z.string().optional().nullable(),
  barbellLift: z.string().optional().nullable(),
  setDetails: z.unknown().optional().nullable(),
  notes: z.string().optional().nullable(),
  rxOrScaled: z.string().optional().nullable(),
  isPr: z.boolean().optional().default(false),
  templateId: z.string().optional().nullable(),
  // Health metrics
  calories: z.number().int().optional().nullable(),
  maxHeartRate: z.number().int().optional().nullable(),
  avgHeartRate: z.number().int().optional().nullable(),
  totalDurationSeconds: z.number().int().optional().nullable(),
  timedDurationSeconds: z.number().int().optional().nullable(),
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
    const where: {
      userId: string;
      workoutDate?: { gte?: Date; lte?: Date };
    } = { userId: session.user.id };
    if (from && to) {
      where.workoutDate = {
        gte: new Date(from),
        lte: new Date(to),
      };
    }
    const sessions = await prisma.workoutSession.findMany({
      where,
      orderBy: { workoutDate: "desc" },
      ...(from && to ? {} : { take: 50 }),
      include: { workoutTemplate: true },
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
    const data = parsed.data;
    const workoutDate = data.workoutDate
      ? new Date(data.workoutDate)
      : new Date();
    const workoutSession = await prisma.workoutSession.create({
      data: {
        userId: session.user.id,
        workoutTemplateId: data.templateId ?? null,
        title: data.title,
        description: data.description ?? null,
        workoutDate,
        bestResultRaw: data.bestResultRaw ?? null,
        bestResultDisplay: data.bestResultDisplay ?? null,
        scoreType: data.scoreType ?? null,
        barbellLift: data.barbellLift ?? null,
        setDetails: (data.setDetails as object) ?? null,
        notes: data.notes ?? null,
        rxOrScaled: data.rxOrScaled ?? null,
        isPr: data.isPr ?? false,
        calories: data.calories ?? null,
        maxHeartRate: data.maxHeartRate ?? null,
        avgHeartRate: data.avgHeartRate ?? null,
        totalDurationSeconds: data.totalDurationSeconds ?? null,
        timedDurationSeconds: data.timedDurationSeconds ?? null,
      },
    });
    return NextResponse.json(workoutSession);
  } catch (e) {
    console.error("Session create error:", e);
    return NextResponse.json(
      { error: "Failed to log workout" },
      { status: 500 }
    );
  }
}
