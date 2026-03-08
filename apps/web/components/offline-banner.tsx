"use client";

import { useState, useEffect } from "react";

export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsOnline(navigator.onLine);
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div
      className="sticky top-0 z-50 bg-amber-500 text-amber-950 text-center py-2 px-4 text-sm font-medium"
      role="status"
      aria-live="polite"
    >
      You&apos;re offline. Some features may be unavailable until you reconnect.
    </div>
  );
}
