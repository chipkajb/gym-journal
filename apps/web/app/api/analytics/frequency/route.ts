import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format, subMonths, subYears, startOfWeek, startOfMonth } from "date-fns";

// GET /api/analytics/frequency?groupBy=week|month&range=1m|3m|6m|1y|all
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const groupBy = (searchParams.get("groupBy") ?? "week") as "week" | "month";
  const range = searchParams.get("range") ?? "3m";

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
    const sessions = await prisma.workoutSession.findMany({
      where: {
        userId: session.user.id,
        ...(from ? { workoutDate: { gte: from } } : {}),
      },
      select: { workoutDate: true, rxOrScaled: true },
      orderBy: { workoutDate: "asc" },
    });

    // Group by week or month
    const buckets = new Map<string, { total: number; rx: number; scaled: number }>();

    for (const s of sessions) {
      const d = new Date(s.workoutDate);
      const key =
        groupBy === "week"
          ? format(startOfWeek(d, { weekStartsOn: 1 }), "yyyy-MM-dd")
          : format(startOfMonth(d), "yyyy-MM");
      if (!buckets.has(key)) {
        buckets.set(key, { total: 0, rx: 0, scaled: 0 });
      }
      const b = buckets.get(key)!;
      b.total++;
      if (s.rxOrScaled === "RX") b.rx++;
      else if (s.rxOrScaled === "Scaled") b.scaled++;
    }

    const data = Array.from(buckets.entries()).map(([period, counts]) => ({
      period,
      label:
        groupBy === "week"
          ? `Week of ${format(new Date(period), "MMM d")}`
          : format(new Date(period + "-01"), "MMM yyyy"),
      ...counts,
    }));

    return NextResponse.json({ groupBy, range, data });
  } catch (e) {
    console.error("Frequency analytics error:", e);
    return NextResponse.json({ error: "Failed to load frequency data" }, { status: 500 });
  }
}
