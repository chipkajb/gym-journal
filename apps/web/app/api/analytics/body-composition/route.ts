import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format, subMonths, subYears } from "date-fns";

// GET /api/analytics/body-composition?range=3m|6m|1y|all
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") ?? "6m";

  const now = new Date();
  let from: Date | undefined;
  switch (range) {
    case "1m":  from = subMonths(now, 1);  break;
    case "3m":  from = subMonths(now, 3);  break;
    case "6m":  from = subMonths(now, 6);  break;
    case "1y":  from = subYears(now, 1);   break;
    default:    from = undefined;
  }

  try {
    const metrics = await prisma.bodyMetric.findMany({
      where: {
        userId: session.user.id,
        ...(from ? { date: { gte: from } } : {}),
      },
      select: {
        date: true,
        weight: true,
        bodyFatPct: true,
        muscleMass: true,
        bmi: true,
      },
      orderBy: { date: "asc" },
    });

    const data = metrics.map((m) => ({
      date: format(new Date(m.date), "yyyy-MM-dd"),
      label: format(new Date(m.date), "MMM d"),
      weight: m.weight,
      bodyFatPct: m.bodyFatPct,
      muscleMass: m.muscleMass,
      bmi: m.bmi,
    }));

    return NextResponse.json({ range, data });
  } catch (e) {
    console.error("Body composition analytics error:", e);
    return NextResponse.json({ error: "Failed to load body composition data" }, { status: 500 });
  }
}
