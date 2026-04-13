"use client";

import { useEffect, useRef } from "react";

/**
 * Keeps the screen on while the user has this app tab open (PWA / mobile).
 * Wake Lock may require a user gesture on some platforms; we retry on
 * pointer/touch, visibility, focus, pageshow (bfcache), and periodically
 * while the tab stays visible (helps some Android builds that drop locks).
 */
export function AppScreenWakeLock() {
  const sentinelRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!("wakeLock" in navigator)) return;

    const release = () => {
      const s = sentinelRef.current;
      sentinelRef.current = null;
      void s?.release?.();
    };

    const acquire = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        release();
        const sentinel = await navigator.wakeLock.request("screen");
        sentinelRef.current = sentinel;
        sentinel.addEventListener("release", () => {
          if (sentinelRef.current === sentinel) sentinelRef.current = null;
        });
      } catch {
        /* unsupported, denied, or not visible */
      }
    };

    void acquire();

    const onVisibility = () => {
      if (document.visibilityState === "visible") void acquire();
      else release();
    };

    const onInteract = () => {
      void acquire();
    };

    const onFocus = () => {
      void acquire();
    };

    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) void acquire();
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onFocus);
    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("pointerdown", onInteract, { passive: true });
    window.addEventListener("touchstart", onInteract, { passive: true });

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void acquire();
    }, 25_000);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("pointerdown", onInteract);
      window.removeEventListener("touchstart", onInteract);
      window.clearInterval(interval);
      release();
    };
  }, []);

  return null;
}
