/** @format */

"use client";

import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
const BOOTH_URL = process.env.NEXT_PUBLIC_BOOTH_URL || "";

function jpegBlob(canvas, quality) {
  return new Promise((resolve, reject) => {
    if (!canvas) {
      reject(new Error("Photocard-nya belum jadi."));
      return;
    }
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("File JPG gagal dibuat.")),
      "image/jpeg",
      quality,
    );
  });
}

async function createUploadBlob(canvas) {
  for (const quality of [0.85, 0.74, 0.64]) {
    const blob = await jpegBlob(canvas, quality);
    if (blob.size <= MAX_UPLOAD_BYTES) return blob;
  }
  throw new Error(
    "Ukuran photocard lebih dari 15 MB. Coba kurangi jumlah fotonya.",
  );
}

function getShareOrigin() {
  if (!BOOTH_URL) {
    throw new Error("NEXT_PUBLIC_BOOTH_URL belum diisi di .env.local.");
  }
  let url;
  try {
    url = new URL(BOOTH_URL);
  } catch {
    throw new Error("Isi NEXT_PUBLIC_BOOTH_URL tidak valid.");
  }
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Alamat QR harus diawali http:// atau https://.");
  }
  if (["localhost", "127.0.0.1", "0.0.0.0", "[::1]"].includes(url.hostname)) {
    throw new Error(
      "Alamat QR masih localhost, jadi HP nggak bisa membukanya. Ganti dengan IPv4 laptop.",
    );
  }
  return url.origin;
}

export default function PhotoQRCode({ canvas, onReady }) {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [photoId, setPhotoId] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [expiresAt, setExpiresAt] = useState(null);
  const [step, setStep] = useState("");
  const [copyState, setCopyState] = useState("");

  const requestRef = useRef(null);
  const uploadingRef = useRef(false);
  const mountedRef = useRef(false);

  // PhotoEditor mengganti key setiap kali kolase berubah.
  // Upload lama dibatalkan ketika tema diganti atau halaman ditutup.
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      requestRef.current?.abort();
    };
  }, []);

  async function handleUpload() {
    if (!canvas || uploadingRef.current || status === "ready") return;

    let shareOrigin;
    try {
      shareOrigin = getShareOrigin();
    } catch (err) {
      setError(err.message);
      setStatus("error");
      return;
    }

    const controller = new AbortController();
    requestRef.current = controller;
    uploadingRef.current = true;
    setError("");
    setStep("MENGECILKAN UKURAN JPG");
    setStatus("uploading");

    try {
      const blob = await createUploadBlob(canvas);
      if (controller.signal.aborted) return;

      setStep("MENGUNGGAH KE LAPTOP BOOTH");
      const data = new FormData();
      data.append("photo", blob, "DTCBooth-photocard.jpg");

      const response = await fetch("/api/photos", {
        method: "POST",
        body: data,
        signal: controller.signal,
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          result.error || `Upload gagal (HTTP ${response.status}).`,
        );
      }
      if (!result.id || !result.downloadPath) {
        throw new Error("Server nggak mengirim link unduhan.");
      }

      const fullUrl = new URL(result.downloadPath, shareOrigin).href;
      if (controller.signal.aborted || !mountedRef.current) return;

      setPhotoId(result.id);
      setDownloadUrl(fullUrl);
      setExpiresAt(result.expiresAt || null);
      setStatus("ready");
      onReady?.({
        photoId: result.id,
        downloadUrl: fullUrl,
        expiresAt: result.expiresAt || null,
      });
    } catch (err) {
      if (controller.signal.aborted || !mountedRef.current) return;
      console.error("DTCBooth QR upload:", err);
      setError(err.message || "QR gagal dibuat.");
      setStatus("error");
    } finally {
      uploadingRef.current = false;
      if (requestRef.current === controller) requestRef.current = null;
    }
  }

  async function copyLink() {
    if (!downloadUrl) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(downloadUrl);
        setCopyState("LINK DISALIN ✓");
      } else {
        window.prompt("Salin link foto ini:", downloadUrl);
      }
    } catch {
      window.prompt("Salin link foto ini:", downloadUrl);
    }
  }

  return (
    <section className="tf-qr" aria-labelledby="tf-qr-title">
      <div className="tf-qr-topline">
        <span>QR FOTO</span>
        <span
          className={`tf-qr-indicator ${status === "ready" ? "is-ready" : ""}`}
        >
          {status === "ready"
            ? "● LINK AKTIF"
            : status === "uploading"
              ? "● MENGUNGGAH"
              : status === "error"
                ? "● PERLU DIULANG"
                : "○ BELUM DIBUAT"}
        </span>
      </div>

      {status === "idle" && (
        <div className="tf-qr-intro" id="tf-qr-title">
          <span className="tf-qr-huge-arrow" aria-hidden="true">
            ↗
          </span>
          <h3>
            DARI LAYAR
            <br />
            <em>KE HP.</em>
          </h3>
          <p>
            Tekan tombol di bawah. Photocard diunggah ke laptop booth, lalu
            QR-nya muncul.
          </p>
          <button
            type="button"
            onClick={handleUpload}
            disabled={!canvas}
            className="tf-qr-main-button"
          >
            BIKIN QR <span aria-hidden="true">↗</span>
          </button>
          <small>HP dan laptop harus nyambung ke Wi-Fi yang sama.</small>
        </div>
      )}

      {status === "uploading" && (
        <div className="tf-qr-processing" role="status" aria-live="polite">
          <span className="tf-qr-spinner" aria-hidden="true">
            +
          </span>
          <span>BENTAR, YA</span>
          <h3>
            LAGI
            <br />
            BIKIN LINK.
          </h3>
          <p>{step}</p>
          <div className="tf-qr-progress-line" aria-hidden="true">
            <i />
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="tf-qr-error" role="alert">
          <span>UNGGAHAN GAGAL</span>
          <h3>
            GAGAL
            <br />
            NYAMBUNG.
          </h3>
          <p>{error}</p>
          <button
            type="button"
            className="tf-qr-main-button"
            onClick={handleUpload}
          >
            COBA LAGI <span aria-hidden="true">↗</span>
          </button>
          <small>
            Tenang, photocard-nya masih ada. Bisa disimpan ke laptop lewat
            tombol di bawah.
          </small>
        </div>
      )}

      {status === "ready" && (
        <div className="tf-qr-ready" aria-live="polite">
          <div className="tf-qr-ready-head">
            <span>QR SIAP</span>
            <h3>
              TINGGAL
              <br />
              <em>SCAN.</em>
            </h3>
            <p>
              Buka kamera HP, arahkan ke QR, lalu tekan link yang muncul.
              Fotonya bisa langsung disimpan.
            </p>
          </div>
          <div className="tf-qr-code-zone">
            <div className="tf-qr-white-mat">
              <QRCodeSVG
                value={downloadUrl}
                size={244}
                level="H"
                marginSize={3}
                bgColor="#FFFFFF"
                fgColor="#0B0B0D"
                title="QR untuk menyimpan photocard DTCBooth"
                role="img"
              />
              <strong>DTCBooth · DTC 2026</strong>
            </div>
            <span>ARAHKAN KAMERA KE SINI &nbsp; ↑</span>
          </div>
          <div className="tf-qr-ready-footer">
            <div className="tf-qr-meta">
              <span>
                ID FOTO <strong>{photoId.slice(0, 8).toUpperCase()}</strong>
              </span>
              <span>
                AKTIF SAMPAI{" "}
                <strong>
                  {expiresAt
                    ? new Date(expiresAt).toLocaleString("id-ID", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "24 JAM"}
                </strong>
              </span>
            </div>
            <div className="tf-qr-actions">
              <button type="button" onClick={copyLink}>
                {copyState || "SALIN LINK"} <span aria-hidden="true">↗</span>
              </button>
              <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                BUKA HALAMAN FOTO <span aria-hidden="true">↗</span>
              </a>
            </div>
            <p className="tf-qr-privacy">
              Siapa pun yang punya link ini bisa membuka fotonya sampai masa
              aktifnya habis.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
