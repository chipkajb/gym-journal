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
    const prs = await prisma.workoutSession.findMany({
      where: { userId: session.user.id, isPr: true },
      orderBy: { workoutDate: "desc" },
      take: 50,
      include: { workoutTemplate: true },
    });
    return NextResponse.json(prs);
  } catch (e) {
    console.error("Analytics PRs error:", e);
    return NextResponse.json(
      { error: "Failed to load PRs" },
      { status: 500 }
    );
  }
}
