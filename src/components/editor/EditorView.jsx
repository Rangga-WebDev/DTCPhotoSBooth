/** @format */

"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  CARD_SIZE,
  downloadCanvas,
  getFilter,
  getPhotocard,
  loadPhotos,
  printPhotocard,
  renderPhotocard,
} from "../../lib/photocard";
import { getPhotoSession } from "../../lib/photoStorage";
import { uploadPhotocard } from "../../lib/photoShare";
import Icon from "../brand/Icon";
import SiteHeader from "../brand/SiteHeader";
import NextVisitorButton from "../kiosk/NextVisitorButton";
import QrTicket from "../qr/QrTicket";
import styles from "./editor.module.css";

// Langkah terakhir: photocard 4R penuh dirender sekali, langsung diunggah untuk QR.
export default function EditorView({ sessionId }) {
  const canvasRef = useRef(null);
  const shareAbort = useRef(null);

  const [load, setLoad] = useState({ status: "loading", error: "" });
  const [session, setSession] = useState(null);
  const [share, setShare] = useState({ status: "uploading", step: "compress" });
  const [paperBusy, setPaperBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  const frame = getPhotocard(session?.frameId);
  const filter = getFilter(session?.filterId);
  const sessionLabel = session?.sessionNumber
    ? String(session.sessionNumber).padStart(3, "0")
    : "---";
  const frameHref = `/frame?session=${encodeURIComponent(sessionId)}`;
  const ready = load.status === "ready";

  const startShare = useCallback(async (canvas) => {
    shareAbort.current?.abort();
    const controller = new AbortController();
    shareAbort.current = controller;
    setShare({ status: "uploading", step: "compress" });

    try {
      const result = await uploadPhotocard(canvas, {
        signal: controller.signal,
        onStep: (step) => {
          if (!controller.signal.aborted) setShare({ status: "uploading", step });
        },
      });
      if (!controller.signal.aborted) setShare({ status: "ready", ...result });
    } catch (error) {
      if (controller.signal.aborted) return;
      console.error("[CIA] QR upload:", error);
      setShare({ status: "error", error: error.message || "QR gagal dibuat. Coba lagi." });
    }
  }, []);

  useEffect(() => () => shareAbort.current?.abort(), []);

  useEffect(() => {
    let cancelled = false;
    let loaded = [];

    (async () => {
      try {
        if (!sessionId) throw new Error("Sesi foto tidak ditemukan.");
        const saved = await getPhotoSession(sessionId);
        if (!saved?.photos?.length) {
          throw new Error("Foto sesi ini sudah tidak ada di browser booth.");
        }
        loaded = await loadPhotos(saved.photos);
        if (cancelled) return;
        setSession(saved);

        const canvas = canvasRef.current;
        await renderPhotocard(loaded, saved.frameId, {
          filter: saved.filterId,
          capturedAt: saved.createdAt,
          sessionNumber: saved.sessionNumber,
          canvas,
        });
        if (cancelled) return;
        setLoad({ status: "ready", error: "" });
        startShare(canvas);
      } catch (error) {
        if (cancelled) return;
        setLoad({ status: "error", error: error.message || "Photocard gagal dibuat." });
      } finally {
        loaded.forEach((image) => image.close?.());
        loaded = [];
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionId, startShare]);

  async function handleDownload() {
    if (!ready) return;
    setActionError("");
    try {
      await downloadCanvas(canvasRef.current, `CIA-Photobooth-${sessionLabel}-${frame.id}.jpg`);
    } catch (error) {
      console.error("Download photocard:", error);
      setActionError("JPG gagal disimpan. Coba lagi.");
    }
  }

  async function handlePrint() {
    if (!ready || paperBusy) return;
    setActionError("");
    setPaperBusy(true);
    try {
      await printPhotocard(canvasRef.current);
    } catch (error) {
      console.error("Print photocard:", error);
      setActionError("Dialog cetak gagal dibuka. Coba lagi.");
    } finally {
      setPaperBusy(false);
    }
  }

  return (
    <main className={`cia-page ${styles.page}`}>
      <SiteHeader
        meta={
          <>
            <span className="cia-label cia-tnum">Sesi {sessionLabel}</span>
            <span className="cia-label">Langkah 3 / 3 · Ambil foto</span>
          </>
        }
      >
        {session && (
          <Link href={frameHref} className="cia-btn cia-btn--sm cia-btn--ghost">
            <Icon name="back" />
            Ganti desain
          </Link>
        )}
        <Link href="/" className="cia-btn cia-btn--sm cia-btn--ghost">
          Keluar
        </Link>
      </SiteHeader>

      {load.status === "error" ? (
        <section className={styles.empty} role="alert">
          <p className="cia-label cia-kicker">Sesi tidak ditemukan</p>
          <h1 className="cia-display">Fotonya tidak ada.</h1>
          <p>{load.error}</p>
          <Link href="/" className="cia-btn cia-btn--primary cia-btn--lg">
            Mulai dari awal
            <Icon name="arrow" />
          </Link>
        </section>
      ) : (
        <div className={styles.body}>
          <section className={styles.stage} aria-label="Photocard">
            {!ready && (
              <p className={styles.loading} role="status">
                Menyusun photocard {CARD_SIZE.name}…
              </p>
            )}
            <canvas
              ref={canvasRef}
              className={styles.card}
              role="img"
              aria-label={`Photocard ${frame.name}, filter ${filter.name}`}
              hidden={!ready}
            />
            <p className={styles.meta}>
              {frame.name} · {filter.name} · {CARD_SIZE.name} {CARD_SIZE.width} × {CARD_SIZE.height} px
            </p>
          </section>

          <aside className={styles.panel} aria-label="Ambil photocard">
            <div className={styles.head}>
              <p className="cia-label cia-kicker">Langkah 3 · Ambil foto</p>
              <h1 className={`cia-display ${styles.title}`}>
                Scan <span className="cia-red">QR-nya.</span>
              </h1>
              <p className={styles.lead}>
                Arahkan kamera HP ke QR untuk menyimpan photocard. Bisa juga dicetak {CARD_SIZE.name}{" "}
                di booth.
              </p>
            </div>

            <QrTicket
              share={share}
              details={{ frame: frame.name, session: sessionLabel }}
              onRetry={() => ready && startShare(canvasRef.current)}
            />

            <div className={styles.actions}>
              <button
                type="button"
                className="cia-btn"
                onClick={handlePrint}
                disabled={!ready || paperBusy}
              >
                <Icon name="print" />
                {paperBusy ? "Membuka…" : `Cetak ${CARD_SIZE.name}`}
              </button>
              <button type="button" className="cia-btn" onClick={handleDownload} disabled={!ready}>
                <Icon name="download" />
                Simpan ke laptop
              </button>
            </div>
            {actionError && (
              <p className="cia-error" role="alert">
                {actionError}
              </p>
            )}

            <NextVisitorButton sessionId={sessionId} qrReady={share.status === "ready"} />
          </aside>
        </div>
      )}
    </main>
  );
}
