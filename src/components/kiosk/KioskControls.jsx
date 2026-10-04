/** @format */

"use client";

import { useEffect, useRef, useState } from "react";

import { usePathname } from "next/navigation";

import styles from "./kioskControls.module.css";

// Tombol operator hanya di layar awal kiosk; halaman lain (termasuk link HP) bersih.
const OPERATOR_PATHS = new Set(["/"]);

export default function KioskControls() {
  const pathname = usePathname();

  const [isFullscreen, setIsFullscreen] = useState(false);

  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState("");

  const wakeLockRef = useRef(null);

  useEffect(() => {
    // Sinkronkan status ketika pengguna
    // menekan ESC untuk keluar fullscreen.
    function handleFullscreenChange() {
      const active = Boolean(document.fullscreenElement);

      setIsFullscreen(active);

      if (!active && wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});

        wakeLockRef.current = null;
      }
    }

    // Minta kembali wake lock jika browser
    // sempat kehilangan fokus.
    async function handleVisibilityChange() {
      if (
        document.visibilityState !== "visible" ||
        !document.fullscreenElement ||
        !navigator.wakeLock ||
        (wakeLockRef.current && !wakeLockRef.current.released)
      ) {
        return;
      }

      try {
        wakeLockRef.current = await navigator.wakeLock.request("screen");
      } catch {
        // Fullscreen tetap bisa digunakan
        // meskipun wake lock gagal.
      }
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);

      document.removeEventListener("visibilitychange", handleVisibilityChange);

      wakeLockRef.current?.release().catch(() => {});
    };
  }, []);

  async function toggleFullscreen() {
    if (isBusy) return;

    setIsBusy(true);
    setMessage("");

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        if (!document.fullscreenEnabled) {
          throw new Error("Browser ini nggak bisa layar penuh.");
        }

        await document.documentElement.requestFullscreen();

        // Membantu mencegah layar tidur.
        if (navigator.wakeLock) {
          try {
            wakeLockRef.current = await navigator.wakeLock.request("screen");
          } catch {
            setMessage(
              "Layar penuh aktif, tapi layar bisa mati sendiri. Matikan Sleep di pengaturan Windows.",
            );
          }
        }
      }
    } catch (error) {
      setMessage(error.message || "Mode layar gagal diganti.");
    } finally {
      setIsBusy(false);
    }
  }

  if (!OPERATOR_PATHS.has(pathname)) {
    return null;
  }

  return (
    <div className={styles.root}>
      <button
        type="button"
        onClick={toggleFullscreen}
        disabled={isBusy}
        className={styles.button}
      >
        <span aria-hidden="true">⛶</span>
        {isFullscreen ? "Keluar layar penuh" : "Mode pameran"}
      </button>

      {message && (
        <p role="status" className={styles.message}>
          {message}
        </p>
      )}
    </div>
  );
}
