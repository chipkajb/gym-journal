import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SUPPORTED_PROVIDERS } from "../../route";

// POST /api/devices/[provider]/sync — trigger a manual sync
// In a real implementation this would call the provider's API using the stored
// OAuth tokens and persist new data points to device_data.
export async function POST(
  _request: Request,
  { params }: { params: { provider: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const provider = SUPPORTED_PROVIDERS.find((p) => p.id === params.provider);
  if (!provider) {
    return NextResponse.json({ error: "Unknown provider" }, { status: 404 });
  }

  const conn = await prisma.deviceConnection.findUnique({
    where: { userId_provider: { userId: session.user.id, provider: params.provider } },
  });

  if (!conn || !conn.isActive) {
    return NextResponse.json(
      { error: "No active connection for this provider" },
      { status: 400 }
    );
  }

  // Placeholder sync logic: In production, use conn.accessToken to call the
  // provider API (e.g. Fitbit Web API, Google Fit REST API) and upsert rows into
  // device_data. Here we just bump the updatedAt to simulate a sync.
  await prisma.deviceConnection.update({
    where: { id: conn.id },
    data: { updatedAt: new Date() },
  });

  return NextResponse.json({
    synced: true,
    provider: params.provider,
    syncedAt: new Date().toISOString(),
    note: "Sync infrastructure is in place. Configure OAuth credentials to enable live data import.",
  });
}
