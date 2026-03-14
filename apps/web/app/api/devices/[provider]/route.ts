import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SUPPORTED_PROVIDERS } from "../route";

// GET /api/devices/[provider] — fetch connection status
export async function GET(
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

  try {
    const conn = await prisma.deviceConnection.findUnique({
      where: { userId_provider: { userId: session.user.id, provider: params.provider } },
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

    return NextResponse.json({
      ...provider,
      connected: !!conn,
      isActive: conn?.isActive ?? false,
      connectedAt: conn?.createdAt?.toISOString() ?? null,
      lastSyncAt: conn?.updatedAt?.toISOString() ?? null,
      dataPointCount: conn?._count?.deviceData ?? 0,
    });
  } catch (e) {
    console.error("Device status error:", e);
    return NextResponse.json({ error: "Failed to get device status" }, { status: 500 });
  }
}

// POST /api/devices/[provider] — initiate connection (stores placeholder; real app
//   would redirect to OAuth and receive token via callback)
export async function POST(
  request: Request,
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

  // In a real implementation this endpoint would be called by the OAuth callback
  // with a real access token. Here we accept an optional token from the body.
  let accessToken = "placeholder-token";
  try {
    const body = await request.json().catch(() => ({}));
    if (body.accessToken) accessToken = body.accessToken;
  } catch {
    // ignore parse errors; use placeholder
  }

  try {
    const conn = await prisma.deviceConnection.upsert({
      where: { userId_provider: { userId: session.user.id, provider: params.provider } },
      create: {
        userId: session.user.id,
        provider: params.provider,
        accessToken,
        isActive: true,
      },
      update: {
        accessToken,
        isActive: true,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      id: conn.id,
      provider: conn.provider,
      connected: true,
      isActive: conn.isActive,
      connectedAt: conn.createdAt.toISOString(),
    });
  } catch (e) {
    console.error("Device connect error:", e);
    return NextResponse.json({ error: "Failed to connect device" }, { status: 500 });
  }
}

// DELETE /api/devices/[provider] — disconnect integration
export async function DELETE(
  _request: Request,
  { params }: { params: { provider: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await prisma.deviceConnection.delete({
      where: { userId_provider: { userId: session.user.id, provider: params.provider } },
    });
    return NextResponse.json({ disconnected: true });
  } catch {
    // Record may not exist — that's fine
    return NextResponse.json({ disconnected: true });
  }
}
