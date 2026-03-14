import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown): string => {
    const s = v == null ? "" : String(v).replace(/\r?\n/g, " ");
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  const lines = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ];
  return lines.join("\n");
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const exportFormat = searchParams.get("format") ?? "json"; // "json" | "csv"
  const type = searchParams.get("type") ?? "all"; // "all" | "workouts" | "metrics"

  try {
    const userId = session.user.id;
    let workoutRows: Record<string, unknown>[] = [];
    let metricRows: Record<string, unknown>[] = [];

    if (type === "all" || type === "workouts") {
      const sessions = await prisma.workoutSession.findMany({
        where: { userId },
        orderBy: { workoutDate: "asc" },
        select: {
          id: true,
          title: true,
          description: true,
          workoutDate: true,
          scoreType: true,
          barbellLift: true,
          bestResultDisplay: true,
          bestResultRaw: true,
          rxOrScaled: true,
          isPr: true,
          notes: true,
          createdAt: true,
        },
      });
      workoutRows = sessions.map((s) => ({
        id: s.id,
        title: s.title,
        description: s.description ?? "",
        date: format(new Date(s.workoutDate), "yyyy-MM-dd"),
        scoreType: s.scoreType ?? "",
        barbellLift: s.barbellLift ?? "",
        result: s.bestResultDisplay ?? "",
        resultRaw: s.bestResultRaw ?? "",
        rxOrScaled: s.rxOrScaled ?? "",
        isPr: s.isPr ? "true" : "false",
        notes: s.notes ?? "",
        createdAt: s.createdAt.toISOString(),
      }));
    }

    if (type === "all" || type === "metrics") {
      const metrics = await prisma.bodyMetric.findMany({
        where: { userId },
        orderBy: { date: "asc" },
        select: {
          id: true,
          date: true,
          weight: true,
          bodyFatPct: true,
          muscleMass: true,
          bmi: true,
          notes: true,
          createdAt: true,
        },
      });
      metricRows = metrics.map((m) => ({
        id: m.id,
        date: format(new Date(m.date), "yyyy-MM-dd"),
        weight: m.weight ?? "",
        bodyFatPct: m.bodyFatPct ?? "",
        muscleMass: m.muscleMass ?? "",
        bmi: m.bmi ?? "",
        notes: m.notes ?? "",
        createdAt: m.createdAt.toISOString(),
      }));
    }

    if (exportFormat === "csv") {
      if (type === "workouts") {
        const csv = toCSV(workoutRows);
        return new Response(csv, {
          headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": 'attachment; filename="workouts.csv"',
          },
        });
      }
      if (type === "metrics") {
        const csv = toCSV(metricRows);
        return new Response(csv, {
          headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": 'attachment; filename="body-metrics.csv"',
          },
        });
      }
      // "all" — zip would be ideal but we keep it simple: return workouts csv with metrics appended
      const csv =
        "# WORKOUTS\n" +
        toCSV(workoutRows) +
        "\n\n# BODY METRICS\n" +
        toCSV(metricRows);
      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": 'attachment; filename="gym-journal-export.csv"',
        },
      });
    }

    // JSON export
    const payload =
      type === "workouts"
        ? { workouts: workoutRows }
        : type === "metrics"
          ? { bodyMetrics: metricRows }
          : { workouts: workoutRows, bodyMetrics: metricRows };

    const json = JSON.stringify(payload, null, 2);
    return new Response(json, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": 'attachment; filename="gym-journal-export.json"',
      },
    });
  } catch (e) {
    console.error("Export error:", e);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
