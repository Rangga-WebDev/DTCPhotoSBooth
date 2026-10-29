/** @format */

"use client";

import { useEffect, useState } from "react";

import { boothKeyHeaders } from "../../lib/boothKey";
import styles from "./boothHealth.module.css";

const STATUS_LABEL = {
  ready: "SIAP",
  checking: "MEMERIKSA",
  waiting: "MENUNGGU",
  error: "BERMASALAH",
};

function shareSummary(share) {
  if (!share) return { label: "MEMERIKSA", detail: "", ok: false };
  if (share.active === "site") return { label: "WEBSITE", detail: share.origin, ok: true };
  if (share.active === "public") return { label: "LINK PUBLIK", detail: share.origin, ok: true };
  if (share.active === "local" && share.fallback) {
    return {
      label: "WI-FI (CADANGAN)",
      detail: share.public?.error || "Tunnel tidak menjawab",
      ok: false,
    };
  }
  if (share.active === "local") return { label: "WI-FI BOOTH", detail: share.origin, ok: true };
  return { label: "BELUM SIAP", detail: share.error || "", ok: false };
}

function keySummary(key) {
  if (!key) return { label: "MEMERIKSA", ok: false };
  if (!key.required) return { label: "TIDAK PERLU", ok: true };
  if (!key.configured) {
    return {
      label: "BELUM ADA DI SERVER",
      ok: false,
      detail: "Website publik wajib memakai env BOOTH_ACCESS_KEY. Isi di server lalu deploy ulang.",
    };
  }
  if (key.valid) return { label: "OK", ok: true };
  return {
    label: key.provided ? "SALAH" : "BELUM DIATUR",
    ok: false,
    detail: "Buka halaman utama dengan ?key=KUNCI sekali di laptop booth.",
  };
}

export default function BoothHealthCheck({ cameraRef, audioReady = false }) {
  const [cameraStatus, setCameraStatus] = useState("checking");
  const [serverStatus, setServerStatus] = useState("checking");
  const [cameraResolution, setCameraResolution] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [share, setShare] = useState(null);

  // Kamera yang sedang dipakai booth; tidak membuat stream baru.
  useEffect(() => {
    function checkCamera() {
      const video = cameraRef?.current?.getVideo?.();
      const track = video?.srcObject?.getVideoTracks?.()[0];
      const active =
        track?.readyState === "live" &&
        !track?.muted &&
        video.readyState >= 2 &&
        video.videoWidth > 0;

      setCameraStatus(active ? "ready" : "waiting");
      setCameraResolution(active ? `${video.videoWidth} × ${video.videoHeight}` : "");
    }

    const first = setTimeout(checkCamera, 0);
    const interval = setInterval(checkCamera, 3000);
    return () => {
      clearTimeout(first);
      clearInterval(interval);
    };
  }, [cameraRef]);

  // Server Next.js + alamat QR + penyimpanan + kunci booth.
  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const response = await fetch("/api/share/status", {
          cache: "no-store",
          headers: boothKeyHeaders(),
        });
        const data = await response.json();
        if (cancelled) return;
        setServerStatus(response.ok ? "ready" : "error");
        setShare(data);
      } catch {
        if (cancelled) return;
        setServerStatus("error");
        setShare({ active: null, error: "Server tidak menjawab." });
      }
    }

    check();
    const interval = setInterval(check, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const qr = shareSummary(share);
  const key = keySummary(share?.key);
  const storageOk = Boolean(share?.storage?.ready);
  const allReady =
    cameraStatus === "ready" &&
    serverStatus === "ready" &&
    audioReady &&
    qr.ok &&
    key.ok &&
    storageOk;

  const items = [
    {
      name: "Kamera",
      value: STATUS_LABEL[cameraStatus],
      ok: cameraStatus === "ready",
      detail: cameraResolution,
    },
    { name: "Suara", value: audioReady ? "SIAP" : "BELUM NYALA", ok: audioReady },
    { name: "Server", value: STATUS_LABEL[serverStatus], ok: serverStatus === "ready" },
    { name: "Link QR", value: qr.label, ok: qr.ok, detail: qr.detail },
    {
      name: "Penyimpanan",
      value: share?.storage
        ? storageOk
          ? share.storage.driver === "blob"
            ? "VERCEL BLOB"
            : "LAPTOP"
          : "BERMASALAH"
        : "MEMERIKSA",
      ok: storageOk,
      detail: share?.storage?.error,
    },
    { name: "Kunci booth", value: key.label, ok: key.ok, detail: key.detail },
  ];

  return (
    <section className={styles.root}>
      <button
        type="button"
        className={styles.toggle}
        onClick={() => setShowDetails((previous) => !previous)}
        aria-expanded={showDetails}
      >
        <span>
          <i className={styles.dot} data-ready={allReady || undefined} aria-hidden="true" />
          {allReady ? "Semua siap" : "Cek perangkat"}
        </span>
        <span>{showDetails ? "Tutup −" : "Lihat +"}</span>
      </button>

      {showDetails && (
        <div className={styles.details}>
          {items.map((item) => (
            <div
              key={item.name}
              className={styles.item}
              data-ok={item.ok || undefined}
              data-bad={!item.ok || undefined}
            >
              <span>{item.name}</span>
              <strong>{item.value}</strong>
              {item.detail && <small>{item.detail}</small>}
            </div>
          ))}
          <p className={styles.note}>
            Kamera &quot;siap&quot; artinya webcam sudah mengirim gambar. Tetap coba satu
            sesi penuh dan scan satu QR dari HP sebelum acara mulai.
          </p>
        </div>
      )}
    </section>
  );
}
