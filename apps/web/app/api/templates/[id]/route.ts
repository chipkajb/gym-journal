import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  category: z.string().min(1).optional(),
  tags: z.array(z.string()).optional(),
  exercises: z
    .array(
      z.object({
        exerciseId: z.string(),
        orderIndex: z.number(),
        sets: z.number().optional().nullable(),
        reps: z.number().optional().nullable(),
        duration: z.number().optional().nullable(),
        restTime: z.number().optional().nullable(),
        notes: z.string().optional().nullable(),
      })
    )
    .optional(),
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
    const template = await prisma.workoutTemplate.findFirst({
      where: { id, userId: session.user.id },
      include: {
        exercises: {
          include: { exercise: true },
          orderBy: { orderIndex: "asc" },
        },
      },
    });
    if (!template) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(template);
  } catch (e) {
    console.error("Template get error:", e);
    return NextResponse.json(
      { error: "Failed to load template" },
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
    const existing = await prisma.workoutTemplate.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const body = await request.json();
    const parsed = updateTemplateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const data = parsed.data;
    if (data.exercises !== undefined) {
      await prisma.templateExercise.deleteMany({
        where: { workoutTemplateId: id },
      });
      if (data.exercises.length > 0) {
        await prisma.templateExercise.createMany({
          data: data.exercises.map((e) => ({
            workoutTemplateId: id,
            exerciseId: e.exerciseId,
            orderIndex: e.orderIndex,
            sets: e.sets ?? null,
            reps: e.reps ?? null,
            duration: e.duration ?? null,
            restTime: e.restTime ?? null,
            notes: e.notes ?? null,
          })),
        });
      }
    }
    const template = await prisma.workoutTemplate.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.tags !== undefined && { tags: data.tags }),
      },
      include: {
        exercises: {
          include: { exercise: true },
          orderBy: { orderIndex: "asc" },
        },
      },
    });
    return NextResponse.json(template);
  } catch (e) {
    console.error("Template update error:", e);
    return NextResponse.json(
      { error: "Failed to update template" },
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
    const existing = await prisma.workoutTemplate.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    await prisma.workoutTemplate.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Template delete error:", e);
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    );
  }
}
