import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  darkModeEnabled: z.boolean().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const [user, profile] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, email: true },
      }),
      prisma.profile.findUnique({
        where: { userId: session.user.id },
        select: { darkModeEnabled: true, preferredUnit: true, weekStartsOn: true },
      }),
    ]);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json({
      name: user.name ?? "",
      email: user.email,
      darkModeEnabled: profile?.darkModeEnabled ?? false,
      preferredUnit: profile?.preferredUnit ?? "metric",
      weekStartsOn: profile?.weekStartsOn ?? 0,
    });
  } catch (e) {
    console.error("Profile GET error:", e);
    return NextResponse.json(
      { error: "Failed to load profile" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { name, darkModeEnabled } = parsed.data;

    const updates: { name?: string } = {};
    if (name !== undefined) updates.name = name;

    await prisma.$transaction(async (tx) => {
      if (Object.keys(updates).length > 0) {
        await tx.user.update({
          where: { id: session.user!.id },
          data: updates,
        });
      }
      const profile = await tx.profile.findUnique({
        where: { userId: session.user!.id },
      });
      if (darkModeEnabled !== undefined) {
        if (profile) {
          await tx.profile.update({
            where: { userId: session.user!.id },
            data: { darkModeEnabled },
          });
        } else {
          await tx.profile.create({
            data: { userId: session.user!.id, darkModeEnabled },
          });
        }
      }
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Profile PATCH error:", e);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
