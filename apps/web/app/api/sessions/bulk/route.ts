import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseWorkoutDateInput } from "@/lib/calendar-date";
import { z } from "zod";

const bulkUpdateSchema = z.object({
  updates: z.array(
    z.object({
      id: z.string(),
      notes: z.string().optional().nullable(),
      rxOrScaled: z.string().optional().nullable(),
      workoutDate: z.string().optional(),
      bestResultDisplay: z.string().optional().nullable(),
      bestResultRaw: z.number().optional().nullable(),
    })
  ),
});

// PATCH /api/sessions/bulk — apply multiple session updates at once
export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = bulkUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { updates } = parsed.data;
    if (updates.length === 0) {
      return NextResponse.json({ updated: 0 });
    }

    // Verify all sessions belong to this user
    const ids = updates.map((u) => u.id);
    const owned = await prisma.workoutSession.findMany({
      where: { id: { in: ids }, userId: session.user.id },
      select: { id: true },
    });
    const ownedIds = new Set(owned.map((s) => s.id));
    const unauthorized = ids.filter((id) => !ownedIds.has(id));
    if (unauthorized.length > 0) {
      return NextResponse.json(
        { error: "One or more sessions not found" },
        { status: 403 }
      );
    }

    // Apply updates
    await Promise.all(
      updates.map((u) =>
        prisma.workoutSession.update({
          where: { id: u.id },
          data: {
            ...(u.notes !== undefined && { notes: u.notes }),
            ...(u.rxOrScaled !== undefined && { rxOrScaled: u.rxOrScaled }),
            ...(u.workoutDate !== undefined && {
              workoutDate: parseWorkoutDateInput(u.workoutDate),
            }),
            ...(u.bestResultDisplay !== undefined && {
              bestResultDisplay: u.bestResultDisplay,
            }),
            ...(u.bestResultRaw !== undefined && {
              bestResultRaw: u.bestResultRaw,
            }),
          },
        })
      )
    );

    return NextResponse.json({ updated: updates.length });
  } catch (e) {
    console.error("Bulk session update error:", e);
    return NextResponse.json({ error: "Failed to update sessions" }, { status: 500 });
  }
}
