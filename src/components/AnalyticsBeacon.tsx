"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function AnalyticsBeacon() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/api")) return;

    const controller = new AbortController();
    void fetch("/api/analytics/collect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname }),
      signal: controller.signal,
      keepalive: true,
    }).catch(() => {
      // Ignore beacon failures (offline, blocked, etc.)
    });

    return () => controller.abort();
  }, [pathname]);

  return null;
}
