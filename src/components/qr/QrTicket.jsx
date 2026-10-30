/** @format */

"use client";

import { QRCodeSVG } from "qrcode.react";
import { useEffect, useRef, useState } from "react";

import CiaMark from "../brand/CiaMark";
import Icon from "../brand/Icon";
import styles from "./qrTicket.module.css";

const STEP_LABEL = {
  compress: "Menyiapkan JPG",
  upload: "Mengunggah photocard",
};
const INSTRUCTION = {
  uploading: "QR muncul di sini begitu photocard selesai diunggah.",
  error: "Photocard-nya aman. Tetap bisa dicetak atau disimpan ke laptop booth.",
  expired: "Link lama sudah tidak bisa dibuka dari HP.",
};
const NETWORK_LABEL = { site: "Link website", public: "Link publik", local: "Wi-Fi booth" };

// Teks sesuai alamat yang benar-benar dipakai QR (dikirim server).
function readyInstruction(share) {
  if (share.mode === "site" || share.mode === "public") {
    return "Scan pakai kamera HP, lalu ketuk link yang muncul. Bisa pakai data seluler, tidak perlu Wi-Fi booth.";
  }
  if (share.fallback) {
    return "Internet booth sedang putus, jadi QR ini hanya bisa dibuka dari HP yang tersambung ke Wi-Fi booth.";
  }
  return "Scan pakai kamera HP, lalu ketuk link yang muncul. HP harus satu Wi-Fi dengan laptop booth.";
}

function useNow(interval) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(id);
  }, [interval]);
  return now;
}

function formatLeft(ms) {
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return "< 1 mnt";
  const hours = Math.floor(minutes / 60);
  return hours ? `${hours} j ${minutes % 60} m` : `${minutes} mnt`;
}

function formatUntil(value) {
  const date = new Date(value);
  const day = date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  const time = date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  return `${day} ${time}`;
}

// share: { status: "uploading" | "ready" | "error", step, id, url, mode, fallback, expiresAt, error }
export default function QrTicket({ share, details, onRetry }) {
  const now = useNow(15000);
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef(null);

  useEffect(() => () => clearTimeout(copyTimer.current), []);

  const expired = share.status === "ready" && now >= share.expiresAt;
  const status = expired ? "expired" : share.status;
  const photoId = share.id ? share.id.slice(0, 8).toUpperCase() : "········";

  async function copyLink() {
    try {
      if (!navigator.clipboard || !window.isSecureContext) throw new Error();
      await navigator.clipboard.writeText(share.url);
      setCopied(true);
      clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Salin link photocard ini:", share.url);
    }
  }

  return (
    <div className={styles.root}>
      <article
        className={styles.ticket}
        data-status={status}
        aria-labelledby="ticket-title"
        aria-busy={status === "uploading"}
      >
        <header className={styles.band}>
          <CiaMark width={22} tone="mono" />
          <span className={styles.brand}>CIA Photobooth</span>
          <span className={styles.bandMeta}>
            {status === "ready" ? (NETWORK_LABEL[share.mode] ?? "QR") : "QR photocard"}
          </span>
        </header>

        <div className={styles.main}>
          <div className={styles.headRow}>
            <div>
              <p className={styles.kicker}>Photocard</p>
              <h2 id="ticket-title" className={styles.name}>
                {details.frame}
              </h2>
            </div>
            <p className={styles.number}>
              <span>No.</span>
              {details.session}
            </p>
          </div>

          <div className={styles.code}>
            {status === "ready" && (
              <QRCodeSVG
                value={share.url}
                size={220}
                level="M"
                marginSize={2}
                bgColor="#FFFFFF"
                fgColor="#000000"
                title="QR photocard CIA Photobooth"
                className={styles.qr}
              />
            )}
            {status === "uploading" && (
              <div className={styles.wait} role="status">
                <i className={styles.spinner} aria-hidden="true" />
                <span>{STEP_LABEL[share.step] ?? "Menyiapkan QR"}…</span>
              </div>
            )}
            {status === "error" && (
              <div className={styles.fail} role="alert">
                <strong>QR gagal dibuat.</strong>
                <span>{share.error}</span>
                <button type="button" className="cia-btn cia-btn--sm cia-btn--primary" onClick={onRetry}>
                  <Icon name="refresh" />
                  Coba lagi
                </button>
              </div>
            )}
            {status === "expired" && (
              <div className={styles.fail} role="status">
                <strong>Link sudah kedaluwarsa.</strong>
                <span>Buat photocard lagi untuk dapat QR baru.</span>
              </div>
            )}
          </div>

          <p
            className={styles.instruction}
            data-warn={status === "ready" && share.fallback ? "" : undefined}
          >
            {status === "ready" ? readyInstruction(share) : INSTRUCTION[status]}
          </p>
        </div>

        <dl className={styles.stub}>
          <div>
            <dt>Photo ID</dt>
            <dd>{photoId}</dd>
          </div>
          <div>
            <dt>Berlaku s.d.</dt>
            <dd>{share.expiresAt ? formatUntil(share.expiresAt) : "—"}</dd>
          </div>
          <div>
            <dt>Sisa</dt>
            <dd>
              {status === "ready"
                ? formatLeft(share.expiresAt - now)
                : status === "expired"
                  ? "Habis"
                  : "—"}
            </dd>
          </div>
        </dl>
      </article>

      {status === "ready" && (
        <>
          <div className={styles.actions}>
            <button type="button" className="cia-btn cia-btn--sm" onClick={copyLink}>
              <Icon name="copy" />
              <span aria-live="polite">{copied ? "Tersalin" : "Salin link"}</span>
            </button>
            <a href={share.url} target="_blank" rel="noopener noreferrer" className="cia-btn cia-btn--sm">
              <Icon name="external" />
              Buka link
            </a>
          </div>
          <p className={styles.privacy}>
            Siapa pun yang punya link ini bisa membuka photocard-nya sampai{" "}
            {formatUntil(share.expiresAt)}. Setelah itu link tidak bisa dibuka lagi.
          </p>
        </>
      )}
    </div>
  );
}
