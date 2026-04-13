import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recomputePrsForWorkout } from "@/lib/pr-utils";
import { SCORE_TYPES } from "@/lib/score-types";
import { z } from "zod";

const scoreTypeEnum = z.enum(SCORE_TYPES);

const createSessionSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  workoutDate: z.string().optional(), // ISO date or YYYY-MM-DD; default today
  bestResultRaw: z.number().optional().nullable(),
  bestResultDisplay: z.string().optional().nullable(),
  scoreType: scoreTypeEnum,
  setDetails: z.unknown().optional().nullable(),
  notes: z.string().optional().nullable(),
  rxOrScaled: z.string().optional().nullable(),
  templateId: z.string().optional().nullable(),
  // Health metrics
  calories: z.number().int().optional().nullable(),
  maxHeartRate: z.number().int().optional().nullable(),
  avgHeartRate: z.number().int().optional().nullable(),
  totalDurationSeconds: z.number().int().optional().nullable(),
});

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const templateId = searchParams.get("templateId");
  const limitParam = searchParams.get("limit");
  try {
    const where: {
      userId: string;
      workoutDate?: { gte?: Date; lte?: Date };
      workoutTemplateId?: string;
    } = { userId: session.user.id };
    if (from && to) {
      where.workoutDate = {
        gte: new Date(from),
        lte: new Date(to),
      };
    }
    if (templateId) {
      where.workoutTemplateId = templateId;
    }
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;
    const sessions = await prisma.workoutSession.findMany({
      where,
      orderBy: { workoutDate: "desc" },
      ...(from && to ? {} : { take: limit ?? 50 }),
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
    const templateId = data.templateId ?? null;
    const scoreType = data.scoreType;
    const bestResultRaw = data.bestResultRaw ?? null;

    // Create the session with isPr=false; recomputePrsForWorkout will correct it.
    if (!data.description?.trim()) {
      return NextResponse.json(
        { error: { description: ["Description is required."] } },
        { status: 400 }
      );
    }
    if (data.scoreType !== "Load") {
      if (data.rxOrScaled !== "RX" && data.rxOrScaled !== "SCALED") {
        return NextResponse.json(
          { error: { rxOrScaled: ["Choose RX or Scaled for this workout."] } },
          { status: 400 }
        );
      }
    }

    const workoutSession = await prisma.workoutSession.create({
      data: {
        userId: session.user.id,
        workoutTemplateId: templateId,
        title: data.title,
        description: data.description ?? null,
        workoutDate,
        bestResultRaw,
        bestResultDisplay: data.bestResultDisplay ?? null,
        scoreType,
        setDetails: (data.setDetails as object) ?? null,
        notes: data.notes ?? null,
        rxOrScaled: data.scoreType === "Load" ? null : data.rxOrScaled,
        isPr: false,
        calories: data.calories ?? null,
        maxHeartRate: data.maxHeartRate ?? null,
        avgHeartRate: data.avgHeartRate ?? null,
        totalDurationSeconds: data.totalDurationSeconds ?? null,
      },
    });

    // Recompute isPr for all sessions in this workout group, including the new one.
    await recomputePrsForWorkout({
      userId: session.user.id,
      workoutTemplateId: templateId,
      title: data.title,
      scoreType,
    });

    // Refetch to return the session with the correct isPr value.
    const updated = await prisma.workoutSession.findUnique({
      where: { id: workoutSession.id },
    });

    return NextResponse.json(updated ?? workoutSession);
  } catch (e) {
    console.error("Session create error:", e);
    return NextResponse.json(
      { error: "Failed to log workout" },
      { status: 500 }
    );
  }
}
