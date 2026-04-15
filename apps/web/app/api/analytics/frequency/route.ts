import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  format,
  subMonths,
  subYears,
  startOfWeek,
  startOfMonth,
  addWeeks,
  addMonths,
  startOfDay,
} from "date-fns";

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

    // Group actual sessions by period key
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

    // Generate all expected periods in the range so zeros appear for empty periods
    const allKeys: string[] = [];
    if (from) {
      if (groupBy === "week") {
        let cursor = startOfWeek(from, { weekStartsOn: 1 });
        const end = startOfWeek(startOfDay(now), { weekStartsOn: 1 });
        while (cursor <= end) {
          allKeys.push(format(cursor, "yyyy-MM-dd"));
          cursor = addWeeks(cursor, 1);
        }
      } else {
        let cursor = startOfMonth(from);
        const end = startOfMonth(now);
        while (cursor <= end) {
          allKeys.push(format(cursor, "yyyy-MM"));
          cursor = addMonths(cursor, 1);
        }
      }
    } else {
      // "all time" — fill every week/month from first logged session through now so empty periods show as zero
      if (sessions.length === 0) {
        // no history: nothing to chart
      } else {
        const earliest = new Date(sessions[0]!.workoutDate);
        if (groupBy === "week") {
          let cursor = startOfWeek(earliest, { weekStartsOn: 1 });
          const end = startOfWeek(startOfDay(now), { weekStartsOn: 1 });
          while (cursor <= end) {
            allKeys.push(format(cursor, "yyyy-MM-dd"));
            cursor = addWeeks(cursor, 1);
          }
        } else {
          let cursor = startOfMonth(earliest);
          const end = startOfMonth(now);
          while (cursor <= end) {
            allKeys.push(format(cursor, "yyyy-MM"));
            cursor = addMonths(cursor, 1);
          }
        }
      }
    }

    const data = allKeys.map((period) => {
      const counts = buckets.get(period) ?? { total: 0, rx: 0, scaled: 0 };
      return {
        period,
        label:
          groupBy === "week"
            ? `Week of ${format(new Date(period), "MMM d")}`
            : format(new Date(period + "-01"), "MMM yyyy"),
        ...counts,
      };
    });

    return NextResponse.json({ groupBy, range, data });
  } catch (e) {
    console.error("Frequency analytics error:", e);
    return NextResponse.json({ error: "Failed to load frequency data" }, { status: 500 });
  }
}
