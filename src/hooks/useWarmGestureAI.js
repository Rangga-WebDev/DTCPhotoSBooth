/** @format */

"use client";

import { useEffect } from "react";

// Siapkan model gestur saat browser senggang; modul MediaPipe dimuat terpisah (dynamic import).
export default function useWarmGestureAI(enabled = true) {
  useEffect(() => {
    if (!enabled) return undefined;

    let cancelled = false;
    const run = () => {
      if (cancelled) return;
      import("../lib/gestureRecognizer")
        .then((module) => module.warmUpGestureAI())
        .catch(() => {});
    };

    const idle = typeof window.requestIdleCallback === "function";
    const id = idle
      ? window.requestIdleCallback(run, { timeout: 2000 })
      : window.setTimeout(run, 800);

    return () => {
      cancelled = true;
      if (idle) window.cancelIdleCallback(id);
      else window.clearTimeout(id);
    };
  }, [enabled]);
}
