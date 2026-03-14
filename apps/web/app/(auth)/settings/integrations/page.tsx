"use client";

import { useCallback, useEffect, useState } from "react";
import { Smartphone, RefreshCw, Link2Off, AlertCircle, CheckCircle2 } from "lucide-react";

type DeviceInfo = {
  id: string;
  name: string;
  description: string;
  dataTypes: string[];
  connected: boolean;
  isActive: boolean;
  connectedAt: string | null;
  lastSyncAt: string | null;
  dataPointCount: number;
};

export default function IntegrationsPage() {
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ id: string; message: string; isError: boolean } | null>(null);

  const loadDevices = useCallback(async () => {
    try {
      const res = await fetch("/api/devices");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setDevices(data);
    } catch {
      // silently keep empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDevices(); }, [loadDevices]);

  async function handleConnect(providerId: string) {
    setFeedback({
      id: providerId,
      message:
        "To connect this integration, configure the OAuth credentials in your environment variables (see docs/INTEGRATIONS.md) and set up the OAuth callback route.",
      isError: false,
    });
  }

  async function handleSync(providerId: string) {
    setSyncing(providerId);
    setFeedback(null);
    try {
      const res = await fetch(`/api/devices/${providerId}/sync`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Sync failed");
      setFeedback({ id: providerId, message: data.note ?? "Sync triggered successfully.", isError: false });
      await loadDevices();
    } catch (e) {
      setFeedback({ id: providerId, message: String(e), isError: true });
    } finally {
      setSyncing(null);
    }
  }

  async function handleDisconnect(providerId: string) {
    setDisconnecting(providerId);
    setFeedback(null);
    try {
      const res = await fetch(`/api/devices/${providerId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to disconnect");
      setFeedback({ id: providerId, message: "Disconnected successfully.", isError: false });
      await loadDevices();
    } catch (e) {
      setFeedback({ id: providerId, message: String(e), isError: true });
    } finally {
      setDisconnecting(null);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Smartphone className="w-6 h-6" />
          Device Integrations
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-4">Loading…</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Smartphone className="w-6 h-6" />
          Device Integrations
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
          Connect wearables and fitness apps to automatically sync activity data into
          your journal. OAuth credentials must be configured before a connection can
          be established — see <code className="text-xs bg-gray-100 dark:bg-gray-700 px-1 rounded">docs/INTEGRATIONS.md</code> for setup instructions.
        </p>
      </div>

      <div className="space-y-4">
        {devices.map((device) => (
          <div
            key={device.id}
            className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-gray-900 dark:text-white">
                    {device.name}
                  </h2>
                  {device.connected && device.isActive ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                      <CheckCircle2 className="w-3 h-3" />
                      Connected
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                      Not connected
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {device.description}
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {device.dataTypes.map((dt) => (
                    <span
                      key={dt}
                      className="px-2 py-0.5 rounded text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                    >
                      {dt.replace("_", " ")}
                    </span>
                  ))}
                </div>
                {device.connected && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                    {device.dataPointCount} data point{device.dataPointCount !== 1 ? "s" : ""}
                    {device.lastSyncAt &&
                      ` · Last synced ${new Date(device.lastSyncAt).toLocaleDateString()}`}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2 shrink-0">
                {device.connected ? (
                  <>
                    <button
                      onClick={() => handleSync(device.id)}
                      disabled={syncing === device.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${syncing === device.id ? "animate-spin" : ""}`} />
                      {syncing === device.id ? "Syncing…" : "Sync"}
                    </button>
                    <button
                      onClick={() => handleDisconnect(device.id)}
                      disabled={disconnecting === device.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                    >
                      <Link2Off className="w-3.5 h-3.5" />
                      {disconnecting === device.id ? "Removing…" : "Disconnect"}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleConnect(device.id)}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                  >
                    Connect
                  </button>
                )}
              </div>
            </div>

            {feedback?.id === device.id && (
              <div
                className={`mt-3 flex items-start gap-2 text-sm px-3 py-2 rounded-lg ${
                  feedback.isError
                    ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                    : "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                }`}
              >
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{feedback.message}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
