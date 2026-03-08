import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title"); // exact workout title for "all results for this workout"
  const limitParam = searchParams.get("limit");
  const limit = title?.trim()
    ? Math.min(Number(limitParam) || 5000, 10000)
    : Math.min(Number(limitParam) || 100, 200);
  try {
    const where: {
      userId: string;
      title?: string | { equals: string; mode: "insensitive" };
    } = { userId: session.user.id };
    if (title?.trim()) {
      where.title = { equals: title.trim(), mode: "insensitive" };
    }
    const sessions = await prisma.workoutSession.findMany({
      where,
      orderBy: { workoutDate: "asc" },
      take: limit,
      select: {
        id: true,
        title: true,
        workoutDate: true,
        bestResultRaw: true,
        bestResultDisplay: true,
        scoreType: true,
        rxOrScaled: true,
        isPr: true,
      },
    });
    return NextResponse.json(sessions);
  } catch (e) {
    console.error("Analytics progress error:", e);
    return NextResponse.json(
      { error: "Failed to load progress data" },
      { status: 500 }
    );
  }
}
