/** @format */

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  CATEGORIES,
  DEFAULT_DESIGN,
  composePhotocard,
  downloadCanvas,
  getPhotocard,
} from "../../lib/photocard";
import PhotoQRCode from "../qr/PhotoQRCode";
import NextVisitorButton from "../kiosk/NextVisitorButton";

const EMPTY_PHOTOS = [];

export default function PhotoEditor({
  photos = EMPTY_PHOTOS,
  frameId = DEFAULT_DESIGN,
  sessionId,
  sessionNumber,
  capturedAt,
}) {
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [downloadError, setDownloadError] = useState("");
  const [previewUrl, setPreviewUrl] = useState(null);
  const [finalCanvas, setFinalCanvas] = useState(null);
  const [canvasVersion, setCanvasVersion] = useState(0);
  const [retryKey, setRetryKey] = useState(0);
  const [qrReady, setQrReady] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const frame = getPhotocard(frameId);
  const frameGroup = CATEGORIES.find((item) => item.id === frame.category);
  const photoCount = Array.isArray(photos) ? photos.length : 0;

  // Frame dipilih di /frame; editor merender photocard 1200 px untuk QR/unduhan.
  useEffect(() => {
    let cancelled = false;

    async function renderPreview() {
      try {
        const canvas = await composePhotocard(photos, frame.id, {
          capturedAt,
          sessionNumber,
        });
        if (cancelled) return;

        const imageUrl = canvas.toDataURL("image/jpeg", 0.85);
        setFinalCanvas(canvas);
        setPreviewUrl(imageUrl);
        setError("");
        setCanvasVersion((version) => version + 1);
        setStatus("ready");
      } catch (err) {
        if (cancelled) return;
        console.error("Teknik Fest composition error:", err);
        setFinalCanvas(null);
        setPreviewUrl(null);
        setError(err.message || "Kolasenya gagal dibuat. Coba lagi, ya.");
        setStatus("error");
      }
    }

    renderPreview();
    return () => {
      cancelled = true;
    };
  }, [photos, frame.id, retryKey, capturedAt, sessionNumber]);

  function resetForComposition() {
    setFinalCanvas(null);
    setPreviewUrl(null);
    setQrReady(false);
    setStatus("loading");
    setError("");
    setDownloadError("");
  }

  function handleRetry() {
    resetForComposition();
    setRetryKey((value) => value + 1);
  }

  function handleDownload() {
    if (!finalCanvas || status !== "ready" || isDownloading) return;
    setIsDownloading(true);
    setDownloadError("");

    try {
      const date = new Date().toISOString().replace(/[:.]/g, "-");
      downloadCanvas(finalCanvas, `DTCBooth-${frame.id}-${date}.jpg`);
    } catch (err) {
      console.error("Teknik Fest download error:", err);
      setDownloadError("JPG gagal disimpan. Coba lagi.");
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <section className="tf-finalize" aria-labelledby="tf-finalize-title">
      <header className="tf-finalize-hero">
        <div className="tf-finalize-hero-left">
          <p className="tf-finalize-kicker">
            <span className="tf-finalize-red-dot" aria-hidden="true" />[ 06 /
            CEK HASIL, AMBIL FOTONYA ]
          </p>
          <h1 id="tf-finalize-title">
            HAMPIR <span>JADI.</span>
          </h1>
          <p className="tf-finalize-deck">
            Ini photocard kamu dengan frame {frame.name}. Mau ganti? Balik ke
            daftar frame. Kalau sudah cocok, scan QR pakai HP.
          </p>
        </div>
        <div className="tf-finalize-hero-right" aria-label="Informasi sesi">
          <span>SESI INI</span>
          <strong>{String(photoCount).padStart(2, "0")} FOTO</strong>
          <span>FRAME {frame.name.toUpperCase()}</span>
          <span className="tf-finalize-live">
            <i aria-hidden="true" />{" "}
            {status === "ready"
              ? "HASIL SIAP"
              : status === "error"
                ? "GAGAL DIBUAT"
                : "LAGI DIPROSES"}
          </span>
        </div>
      </header>

      <div className="tf-finalize-ruler" aria-hidden="true">
        <span>01 HASIL</span>
        <span>02 FRAME</span>
        <span>03 QR</span>
      </div>

      <div className="tf-finalize-workbench">
        <section
          className="tf-finalize-proof"
          aria-labelledby="tf-finalize-proof-title"
        >
          <div className="tf-finalize-panel-top">
            <span>01 / HASIL AKHIR</span>
            <span>IKUT FRAME YANG DIPILIH &nbsp; ↘</span>
          </div>

          <div className="tf-finalize-proof-title-row">
            <h2 id="tf-finalize-proof-title">
              HASIL<em>NYA.</em>
            </h2>
            <div className="tf-finalize-proof-side">
              <span>LEBAR 1200 PX</span>
              <span>FORMAT JPG</span>
            </div>
          </div>

          <div
            className="tf-finalize-preview-bay"
            aria-live="polite"
            aria-busy={status === "loading"}
          >
            <div className="tf-finalize-tickmarks" aria-hidden="true" />
            <div className="tf-finalize-proof-id" aria-hidden="true">
              PRATINJAU
            </div>

            {status === "loading" && (
              <div className="tf-finalize-pending" role="status">
                <span className="tf-finalize-loader" aria-hidden="true">
                  +
                </span>
                <strong>
                  LAGI
                  <br />
                  DISUSUN.
                </strong>
                <p>
                  Menyusun {photoCount} foto ke frame {frame.name}
                </p>
              </div>
            )}

            {status === "error" && (
              <div
                className="tf-finalize-pending tf-finalize-pending-error"
                role="alert"
              >
                <span aria-hidden="true">!</span>
                <strong>
                  GAGAL
                  <br />
                  DISUSUN.
                </strong>
                <p>{error}</p>
                <button
                  type="button"
                  className="tf-finalize-outline-action"
                  onClick={handleRetry}
                >
                  COBA LAGI <span aria-hidden="true">↗</span>
                </button>
              </div>
            )}

            {status === "ready" && previewUrl && (
              // Blob/data preview berasal dari Canvas lokal, bukan remote image.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className="tf-finalize-final-image"
                src={previewUrl}
                alt={`Photocard DTCBooth, ${photoCount} foto, frame ${frame.name}`}
              />
            )}

            <span
              className="tf-finalize-crop tf-finalize-crop-tl"
              aria-hidden="true"
            />
            <span
              className="tf-finalize-crop tf-finalize-crop-tr"
              aria-hidden="true"
            />
            <span
              className="tf-finalize-crop tf-finalize-crop-bl"
              aria-hidden="true"
            />
            <span
              className="tf-finalize-crop tf-finalize-crop-br"
              aria-hidden="true"
            />
          </div>

          <div className="tf-finalize-proof-footer">
            <span>FRAME: {frame.name.toUpperCase()}</span>
            <span>{photoCount} FOTO</span>
            <span>DTC 2026</span>
          </div>
        </section>

        <aside
          className="tf-finalize-selector"
          aria-labelledby="tf-finalize-selector-title"
        >
          <div className="tf-finalize-panel-top">
            <span>02 / FRAME</span>
            <span>{frameGroup?.name.toUpperCase()}</span>
          </div>

          <div className="tf-finalize-selector-heading">
            <h2 id="tf-finalize-selector-title">
              FRAME
              <br />
              <em>KAMU.</em>
            </h2>
            <p>
              <b>{frame.name}</b> · {frame.note}
            </p>
          </div>

          <Link
            className="tf-finalize-outline-action"
            href={`/frame?session=${encodeURIComponent(sessionId)}`}
          >
            GANTI FRAME <span aria-hidden="true">↗</span>
          </Link>

          <div className="tf-finalize-output-summary">
            <span>[ RINGKASAN ]</span>
            <dl>
              <div>
                <dt>FRAME</dt>
                <dd>{frame.name.toUpperCase()}</dd>
              </div>
              <div>
                <dt>JUMLAH FOTO</dt>
                <dd>{String(photoCount).padStart(2, "0")}</dd>
              </div>
              <div>
                <dt>FORMAT</dt>
                <dd>JPG</dd>
              </div>
              <div>
                <dt>QR</dt>
                <dd className={qrReady ? "is-live" : ""}>
                  {qrReady ? "● SUDAH DIBUAT" : "○ BELUM DIBUAT"}
                </dd>
              </div>
            </dl>
          </div>

          <button
            type="button"
            className="tf-finalize-download"
            onClick={handleDownload}
            disabled={status !== "ready" || isDownloading}
          >
            <span>
              {isDownloading ? "MENYIAPKAN JPG…" : "SIMPAN KE LAPTOP"}
            </span>
            <span aria-hidden="true">↓</span>
          </button>
          {downloadError && (
            <p className="tf-finalize-download-error" role="alert">
              {downloadError}
            </p>
          )}
          <p className="tf-finalize-download-hint">
            Tombol ini menyimpan file ke laptop booth. Buat ke HP, pakai QR di
            bawah.
          </p>
        </aside>
      </div>

      <section
        className="tf-finalize-dispatch"
        aria-labelledby="tf-finalize-dispatch-title"
      >
        <div className="tf-finalize-dispatch-copy">
          <span className="tf-finalize-section-marker">03 / KIRIM KE HP</span>
          <h2 id="tf-finalize-dispatch-title">
            BAWA
            <br />
            <em>PULANG.</em>
          </h2>
          <p>
            Kolase diunggah ke laptop booth, lalu muncul QR. Scan pakai kamera
            HP dan fotonya bisa langsung disimpan. Nggak perlu login atau
            install aplikasi.
          </p>
          <div className="tf-finalize-dispatch-rule" aria-hidden="true">
            <span>+</span>
            <span>+</span>
          </div>
          <div className="tf-finalize-dispatch-spec">
            <span>CARA KIRIM</span>
            <strong>QR, LEWAT WI-FI BOOTH</strong>
            <span>LINK AKTIF</span>
            <strong>24 JAM</strong>
            <span>BISA DIBUKA</span>
            <strong>SIAPA PUN YANG PUNYA LINK</strong>
          </div>
        </div>
        <div className="tf-finalize-dispatch-stage">
          {status === "ready" && finalCanvas ? (
            <PhotoQRCode
              key={canvasVersion}
              canvas={finalCanvas}
              onReady={() => setQrReady(true)}
            />
          ) : (
            <div className="tf-finalize-qr-wait" role="status">
              <span>QR</span>
              <strong>
                {status === "error" ? "KOLASE GAGAL" : "NUNGGU KOLASE"}
              </strong>
              <p>
                {status === "error"
                  ? "Beresin dulu kolasenya di atas, baru QR bisa dibuat."
                  : "QR muncul setelah kolasenya jadi."}
              </p>
            </div>
          )}
        </div>
      </section>

      <section
        className="tf-finalize-handoff"
        aria-label="Pergantian pengunjung"
      >
        <div className="tf-finalize-handoff-heading">
          <span>04 / GANTIAN</span>
          <strong>
            SELESAI?
            <br />
            GANTIAN, YUK.
          </strong>
        </div>
        {qrReady ? (
          <NextVisitorButton sessionId={sessionId} qrReady={qrReady} />
        ) : (
          <div className="tf-finalize-handoff-wait" role="status">
            <span aria-hidden="true">↗</span>
            <p>
              Bikin QR dulu, terus pastikan fotonya sudah kebuka di HP
              pengunjung. Setelah itu baru mulai sesi baru.
            </p>
          </div>
        )}
      </section>

      <footer className="tf-finalize-footer">
        <span>DTC 2026</span>
        <span>FOTO DULU, BARU PULANG.</span>
        <span>DTCBOOTH</span>
      </footer>
    </section>
  );
}
