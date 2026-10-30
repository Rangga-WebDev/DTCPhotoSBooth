/** @format */

"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { setBoothKey } from "../../lib/boothKey";
import Icon from "../brand/Icon";
import styles from "./kioskControls.module.css";

// Tombol operator hanya di layar awal kiosk; halaman lain (termasuk link HP) bersih.
const OPERATOR_PATHS = new Set(["/"]);

export default function KioskControls() {
  const pathname = usePathname();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState("");
  const wakeLockRef = useRef(null);

  // /?key=KUNCI: simpan kunci upload booth, lalu hapus dari address bar.
  useEffect(() => {
    if (!OPERATOR_PATHS.has(pathname)) return undefined;
    const url = new URL(window.location.href);
    if (!url.searchParams.has("key")) return undefined;

    const key = url.searchParams.get("key")?.trim() ?? "";
    setBoothKey(key);
    url.searchParams.delete("key");
    window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);

    // Tanpa cleanup: di StrictMode efek dijalankan dua kali dan URL sudah bersih di putaran kedua.
    setTimeout(
      () =>
        setMessage(
          key
            ? "Kunci booth tersimpan di browser ini. Upload foto untuk QR sudah diizinkan."
            : "Kunci booth dihapus dari browser ini.",
        ),
      0,
    );
    return undefined;
  }, [pathname]);

  useEffect(() => {
    // Sinkronkan status saat operator menekan ESC.
    function handleFullscreenChange() {
      const active = Boolean(document.fullscreenElement);
      setIsFullscreen(active);
      if (!active && wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    }

    // Minta ulang wake lock kalau browser sempat kehilangan fokus.
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
        // Layar penuh tetap jalan walau wake lock gagal.
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
          throw new Error("Browser ini tidak bisa layar penuh.");
        }
        await document.documentElement.requestFullscreen();
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

  if (!OPERATOR_PATHS.has(pathname)) return null;

  return (
    <div className={styles.root}>
      {message && (
        <p role="status" className={styles.message}>
          {message}
        </p>
      )}
      <button
        type="button"
        onClick={toggleFullscreen}
        disabled={isBusy}
        className={styles.button}
      >
        <Icon name="expand" />
        {isFullscreen ? "Keluar layar penuh" : "Mode pameran"}
      </button>
    </div>
  );
}
