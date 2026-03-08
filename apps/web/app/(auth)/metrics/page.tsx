import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BodyMetricsPageClient } from "./body-metrics-page-client";

export default async function MetricsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const [metrics, profile] = await Promise.all([
    prisma.bodyMetric.findMany({
      where: { userId: session.user.id },
      orderBy: { date: "desc" },
      take: 200,
    }),
    prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: { preferredUnit: true },
    }),
  ]);

  const preferredUnit = profile?.preferredUnit ?? "metric";
  const metricsForClient = metrics.map((m) => ({
    id: m.id,
    date: m.date.toISOString(),
    weight: m.weight,
    bodyFatPct: m.bodyFatPct,
    muscleMass: m.muscleMass,
    bmi: m.bmi,
    notes: m.notes,
  }));

  return (
    <BodyMetricsPageClient
      initialMetrics={metricsForClient}
      preferredUnit={preferredUnit}
    />
  );
}
