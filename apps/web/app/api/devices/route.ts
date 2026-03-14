import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const SUPPORTED_PROVIDERS: {
  id: string;
  name: string;
  description: string;
  dataTypes: string[];
}[] = [
  {
    id: "apple_health",
    name: "Apple Health",
    description: "Sync workouts, steps, heart rate, and body metrics from Apple Health via HealthKit.",
    dataTypes: ["steps", "heart_rate", "calories", "sleep", "workouts"],
  },
  {
    id: "google_fit",
    name: "Google Fit",
    description: "Import activity data, workouts, and biometrics from Google Fit.",
    dataTypes: ["steps", "heart_rate", "calories", "workouts", "weight"],
  },
  {
    id: "fitbit",
    name: "Fitbit",
    description: "Pull daily activity, sleep analysis, and heart rate data from your Fitbit device.",
    dataTypes: ["steps", "heart_rate", "sleep", "calories", "weight"],
  },
  {
    id: "garmin",
    name: "Garmin Connect",
    description: "Sync performance metrics, GPS workouts, and recovery data from Garmin devices.",
    dataTypes: ["steps", "heart_rate", "sleep", "workouts", "stress"],
  },
];

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const connections = await prisma.deviceConnection.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        provider: true,
        isActive: true,
        expiresAt: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { deviceData: true } },
      },
    });

    const result = SUPPORTED_PROVIDERS.map((p) => {
      const conn = connections.find((c) => c.provider === p.id);
      return {
        ...p,
        connected: !!conn,
        isActive: conn?.isActive ?? false,
        connectedAt: conn?.createdAt?.toISOString() ?? null,
        lastSyncAt: conn?.updatedAt?.toISOString() ?? null,
        dataPointCount: conn?._count?.deviceData ?? 0,
        expiresAt: conn?.expiresAt?.toISOString() ?? null,
      };
    });

    return NextResponse.json(result);
  } catch (e) {
    console.error("Devices list error:", e);
    return NextResponse.json({ error: "Failed to load integrations" }, { status: 500 });
  }
}
