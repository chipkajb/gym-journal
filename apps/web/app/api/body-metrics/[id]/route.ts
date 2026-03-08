import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateBodyMetricSchema = z.object({
  date: z.string().optional(),
  weight: z.number().optional().nullable(),
  bodyFatPct: z.number().optional().nullable(),
  muscleMass: z.number().optional().nullable(),
  bmi: z.number().optional().nullable(),
  measurements: z.record(z.unknown()).optional().nullable(),
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
    const metric = await prisma.bodyMetric.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!metric) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(metric);
  } catch (e) {
    console.error("Body metric get error:", e);
    return NextResponse.json(
      { error: "Failed to load body metric" },
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
  try {
    const existing = await prisma.bodyMetric.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const body = await request.json();
    const parsed = updateBodyMetricSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const data = parsed.data;
    const updateData: Prisma.BodyMetricUpdateInput = {
      ...(data.date && { date: new Date(data.date) }),
      ...(data.weight !== undefined && { weight: data.weight }),
      ...(data.bodyFatPct !== undefined && { bodyFatPct: data.bodyFatPct }),
      ...(data.muscleMass !== undefined && { muscleMass: data.muscleMass }),
      ...(data.bmi !== undefined && { bmi: data.bmi }),
      ...(data.measurements !== undefined && {
        measurements:
          data.measurements === null
            ? Prisma.JsonNull
            : (data.measurements as Prisma.InputJsonValue),
      }),
      ...(data.notes !== undefined && { notes: data.notes }),
    };
    const metric = await prisma.bodyMetric.update({
      where: { id },
      data: updateData,
    });
    return NextResponse.json(metric);
  } catch (e) {
    console.error("Body metric update error:", e);
    return NextResponse.json(
      { error: "Failed to update body metric" },
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
    const existing = await prisma.bodyMetric.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    await prisma.bodyMetric.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Body metric delete error:", e);
    return NextResponse.json(
      { error: "Failed to delete body metric" },
      { status: 500 }
    );
  }
}
