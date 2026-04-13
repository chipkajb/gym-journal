import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type DayAgg = {
  day: string;
  avgHeartRateAvg: number | null;
  maxHeartRateMax: number | null;
  caloriesSum: number;
  trainingMinutesSum: number;
  sessionCount: number;
};

function startOfDayUtc(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const fromStr = searchParams.get("from");
  const toStr = searchParams.get("to");
  if (!fromStr || !toStr) {
    return NextResponse.json(
      { error: "Query params `from` and `to` (ISO dates) are required." },
      { status: 400 }
    );
  }
  const from = startOfDayUtc(new Date(fromStr));
  const to = startOfDayUtc(new Date(toStr));
  if (isNaN(from.getTime()) || isNaN(to.getTime()) || from > to) {
    return NextResponse.json({ error: "Invalid date range." }, { status: 400 });
  }

  const toExclusive = new Date(to);
  toExclusive.setUTCDate(toExclusive.getUTCDate() + 1);

  try {
    const rows = await prisma.workoutSession.findMany({
      where: {
        userId: session.user.id,
        workoutDate: { gte: from, lt: toExclusive },
        OR: [
          { calories: { not: null } },
          { maxHeartRate: { not: null } },
          { avgHeartRate: { not: null } },
          { totalDurationSeconds: { not: null } },
        ],
      },
      select: {
        workoutDate: true,
        calories: true,
        maxHeartRate: true,
        avgHeartRate: true,
        totalDurationSeconds: true,
      },
    });

    const byDay = new Map<string, DayAgg>();
    const avgHrAcc = new Map<string, { sum: number; n: number }>();

    for (const r of rows) {
      const key = r.workoutDate.toISOString().slice(0, 10);
      let cell = byDay.get(key);
      if (!cell) {
        cell = {
          day: key,
          avgHeartRateAvg: null,
          maxHeartRateMax: null,
          caloriesSum: 0,
          trainingMinutesSum: 0,
          sessionCount: 0,
        };
        byDay.set(key, cell);
      }
      cell.sessionCount += 1;
      if (r.calories != null) cell.caloriesSum += r.calories;
      if (r.maxHeartRate != null) {
        cell.maxHeartRateMax =
          cell.maxHeartRateMax == null
            ? r.maxHeartRate
            : Math.max(cell.maxHeartRateMax, r.maxHeartRate);
      }
      if (r.avgHeartRate != null) {
        const acc = avgHrAcc.get(key) ?? { sum: 0, n: 0 };
        acc.sum += r.avgHeartRate;
        acc.n += 1;
        avgHrAcc.set(key, acc);
      }
      if (r.totalDurationSeconds != null) {
        cell.trainingMinutesSum += r.totalDurationSeconds / 60;
      }
    }

    for (const [key, { sum, n }] of avgHrAcc) {
      const cell = byDay.get(key);
      if (cell && n > 0) cell.avgHeartRateAvg = Math.round(sum / n);
    }

    const series = [...byDay.values()].sort((a, b) => a.day.localeCompare(b.day));

    return NextResponse.json({ series });
  } catch (e) {
    console.error("Health timeseries error:", e);
    return NextResponse.json(
      { error: "Failed to load health metrics" },
      { status: 500 }
    );
  }
}
