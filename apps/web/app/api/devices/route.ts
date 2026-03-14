import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SUPPORTED_PROVIDERS } from "@/lib/device-providers";

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
