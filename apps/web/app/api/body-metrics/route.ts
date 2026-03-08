import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createBodyMetricSchema = z.object({
  date: z.string(), // ISO date
  weight: z.number().optional().nullable(),
  bodyFatPct: z.number().optional().nullable(),
  muscleMass: z.number().optional().nullable(),
  bmi: z.number().optional().nullable(),
  measurements: z.record(z.unknown()).optional().nullable(),
  notes: z.string().optional().nullable(),
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
    const where: { userId: string; date?: { gte?: Date; lte?: Date } } = {
      userId: session.user.id,
    };
    if (from && to) {
      where.date = {
        gte: new Date(from),
        lte: new Date(to),
      };
    }
    const metrics = await prisma.bodyMetric.findMany({
      where,
      orderBy: { date: "desc" },
      ...(from && to ? {} : { take: 200 }),
    });
    return NextResponse.json(metrics);
  } catch (e) {
    console.error("Body metrics list error:", e);
    return NextResponse.json(
      { error: "Failed to load body metrics" },
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
    const parsed = createBodyMetricSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const data = parsed.data;
    const metric = await prisma.bodyMetric.create({
      data: {
        userId: session.user.id,
        date: new Date(data.date),
        weight: data.weight ?? null,
        bodyFatPct: data.bodyFatPct ?? null,
        muscleMass: data.muscleMass ?? null,
        bmi: data.bmi ?? null,
        measurements:
          data.measurements === undefined
            ? undefined
            : data.measurements === null
              ? Prisma.JsonNull
              : (data.measurements as Prisma.InputJsonValue),
        notes: data.notes ?? null,
      },
    });
    return NextResponse.json(metric);
  } catch (e) {
    console.error("Body metric create error:", e);
    return NextResponse.json(
      { error: "Failed to save body metric" },
      { status: 500 }
    );
  }
}
