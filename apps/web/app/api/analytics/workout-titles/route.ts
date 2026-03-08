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
    const groups = await prisma.workoutSession.groupBy({
      by: ["title"],
      where: { userId: session.user.id },
      _count: { id: true },
      orderBy: { title: "asc" },
    });
    const titles = groups.map((g) => g.title);
    return NextResponse.json({ titles });
  } catch (e) {
    console.error("Analytics workout-titles error:", e);
    return NextResponse.json(
      { error: "Failed to load workout titles" },
      { status: 500 }
    );
  }
}
