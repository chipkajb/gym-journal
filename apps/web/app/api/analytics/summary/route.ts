import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const [totalSessions, prCount, recentCount] = await Promise.all([
      prisma.workoutSession.count({ where: { userId: session.user.id } }),
      prisma.workoutSession.count({
        where: { userId: session.user.id, isPr: true },
      }),
      prisma.workoutSession.count({
        where: {
          userId: session.user.id,
          workoutDate: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);
    return NextResponse.json({
      totalSessions,
      prCount,
      recentCount,
    });
  } catch (e) {
    console.error("Analytics summary error:", e);
    return NextResponse.json(
      { error: "Failed to load summary" },
      { status: 500 }
    );
  }
}
