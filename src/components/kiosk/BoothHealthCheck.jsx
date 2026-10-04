/** @format */

"use client";

import { useEffect, useState } from "react";

import styles from "./boothHealth.module.css";

export default function BoothHealthCheck({ cameraRef, audioReady = false }) {
  const [cameraStatus, setCameraStatus] = useState("checking");

  const [serverStatus, setServerStatus] = useState("checking");

  const [cameraResolution, setCameraResolution] = useState("");

  const [showDetails, setShowDetails] = useState(false);

  const [share, setShare] = useState(null);

  // Periksa kamera yang sedang digunakan.
  // Tidak membuat stream kamera baru.
  useEffect(() => {
    function checkCamera() {
      const video = cameraRef?.current?.getVideo?.();

      if (!video) {
        setCameraStatus("waiting");
        setCameraResolution("");
        return;
      }

      const stream = video.srcObject;

      const videoTrack = stream?.getVideoTracks?.()[0];

      const isActive =
        videoTrack?.readyState === "live" &&
        !videoTrack?.muted &&
        video.readyState >= 2 &&
        video.videoWidth > 0 &&
        video.videoHeight > 0;

      if (isActive) {
        setCameraStatus("ready");

        setCameraResolution(`${video.videoWidth} × ${video.videoHeight}`);
      } else {
        setCameraStatus("waiting");
        setCameraResolution("");
      }
    }

    checkCamera();

    const interval = window.setInterval(checkCamera, 3000);

    return () => {
      window.clearInterval(interval);
    };
  }, [cameraRef]);

  // Periksa apakah server Next.js merespons.
  // Ini bukan pemeriksaan koneksi HP.
  useEffect(() => {
    let cancelled = false;

    async function checkServer() {
      try {
        const response = await fetch("/", {
          method: "HEAD",
          cache: "no-store",
        });

        if (!cancelled) {
          setServerStatus(response.ok ? "ready" : "error");
        }
      } catch {
        if (!cancelled) {
          setServerStatus("error");
        }
      }
    }

    checkServer();

    const interval = window.setInterval(checkServer, 15000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  // Alamat QR yang aktif; mode publik ikut mengecek tunnel sungguhan.
  useEffect(() => {
    let cancelled = false;

    async function checkShare() {
      try {
        const response = await fetch("/api/share/status", {
          cache: "no-store",
        });
        const data = await response.json();
        if (!cancelled) setShare(data);
      } catch {
        if (!cancelled) setShare({ active: null, local: {}, public: {} });
      }
    }

    checkShare();

    const interval = window.setInterval(checkShare, 30000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  function shareSummary() {
    if (!share) return { label: "MEMERIKSA", detail: "" };
    if (share.active === "public") {
      return { label: "LINK PUBLIK", detail: share.public.origin };
    }
    if (share.active === "local" && share.mode === "public") {
      return {
        label: "WI-FI (CADANGAN)",
        detail: share.public.error || "Tunnel tidak menjawab",
      };
    }
    if (share.active === "local") {
      return { label: "WI-FI BOOTH", detail: share.local.origin };
    }
    return {
      label: "BELUM SIAP",
      detail: share.public?.error || share.local?.error || "",
    };
  }

  const shareInfo = shareSummary();

  function statusLabel(status) {
    if (status === "ready") return "SIAP";
    if (status === "checking") return "MEMERIKSA";
    if (status === "waiting") return "MENUNGGU";
    return "BERMASALAH";
  }

  const allReady =
    cameraStatus === "ready" &&
    serverStatus === "ready" &&
    audioReady &&
    Boolean(share?.active);

  return (
    <section className={styles.root}>
      <button
        type="button"
        className={styles.toggle}
        onClick={() => setShowDetails((previous) => !previous)}
        aria-expanded={showDetails}
      >
        <span>
          <i
            className={styles.dot}
            data-ready={allReady || undefined}
            aria-hidden="true"
          />
          {allReady ? "SEMUA SIAP" : "CEK PERANGKAT"}
        </span>

        <span>{showDetails ? "TUTUP −" : "LIHAT +"}</span>
      </button>

      {showDetails && (
        <div className={styles.details}>
          <div className={styles.item}>
            <span>Kamera</span>

            <strong>{statusLabel(cameraStatus)}</strong>

            {cameraResolution && <small>{cameraResolution}</small>}
          </div>

          <div className={styles.item}>
            <span>Suara</span>

            <strong>{audioReady ? "SIAP" : "BELUM NYALA"}</strong>
          </div>

          <div className={styles.item}>
            <span>Server</span>

            <strong>{statusLabel(serverStatus)}</strong>
          </div>

          <div className={styles.item}>
            <span>Link QR</span>

            <strong>{shareInfo.label}</strong>

            {shareInfo.detail && <small>{shareInfo.detail}</small>}
          </div>

          <p className={styles.note}>
            Kamera &quot;siap&quot; artinya webcam sudah mengirim gambar. Belum
            tentu gesturnya kebaca, jadi tetap coba langsung sebelum acara
            mulai.
          </p>

          <p className={styles.note}>
            {share?.active === "public"
              ? "Tes satu QR dari HP yang memakai data seluler (Wi-Fi dimatikan) sebelum acara mulai."
              : "Tes satu QR dari HP yang tersambung ke Wi-Fi booth sebelum acara mulai."}
          </p>
        </div>
      )}
    </section>
  );
}
