/** @format */

"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { pad2 } from "../../data/formats";
import {
  CARD_SIZE,
  CATEGORIES,
  DEFAULT_FILTER,
  FILTERS,
  downloadCanvas,
  getFilter,
  getPhotocard,
  loadPhotos,
  printPhotocard,
  renderFilterSwatch,
  renderPhotocard,
} from "../../lib/photocard";
import { getPhotoSession, updatePhotoSession } from "../../lib/photoStorage";
import { uploadPhotocard } from "../../lib/photoShare";
import DtcHeader from "../brand/DtcHeader";
import NextVisitorButton from "../kiosk/NextVisitorButton";
import QrTicket from "../qr/QrTicket";
import styles from "./editor.module.css";

const PREVIEW_SCALE = 0.6;
const SWATCH = { width: 240, height: 180 };
const STAGE_LABEL = {
  edit: "Final touch",
  printing: "Developing",
  done: "Take it home",
};

export default function EditorView({ sessionId }) {
  const previewRef = useRef(null);
  const swatches = useRef(new Map());
  const shareAbort = useRef(null);

  const [load, setLoad] = useState({ status: "loading", error: "" });
  const [session, setSession] = useState(null);
  const [images, setImages] = useState(null);
  const [filterId, setFilterId] = useState(DEFAULT_FILTER);
  const [printing, setPrinting] = useState(false);
  const [fed, setFed] = useState(false);
  const [output, setOutput] = useState(null);
  const [printError, setPrintError] = useState("");
  const [share, setShare] = useState(null);
  const [actionError, setActionError] = useState("");
  const [paperBusy, setPaperBusy] = useState(false);

  const stage = !printing ? "edit" : fed && output ? "done" : "printing";
  const frame = getPhotocard(session?.frameId);
  const filter = getFilter(filterId);
  const group = CATEGORIES.find((item) => item.id === frame.category);
  const count = session?.photos?.length ?? 0;
  const sessionLabel = session?.sessionNumber
    ? String(session.sessionNumber).padStart(3, "0")
    : "---";
  const frameHref = `/frame?session=${encodeURIComponent(sessionId)}`;
  const qrReady = share?.status === "ready";

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
        setFilterId(getFilter(saved.filterId).id);
        setImages(loaded);
        setLoad({ status: "ready", error: "" });
      } catch (error) {
        if (cancelled) return;
        setLoad({
          status: "error",
          error: error.message || "Sesi foto gagal dibuka.",
        });
      }
    })();

    return () => {
      cancelled = true;
      loaded.forEach((image) => image.close?.());
    };
  }, [sessionId]);

  useEffect(() => {
    if (!images || !session || !previewRef.current) return;
    let cancelled = false;

    renderPhotocard(images, session.frameId, {
      scale: PREVIEW_SCALE,
      filter: filterId,
      capturedAt: session.createdAt,
      sessionNumber: session.sessionNumber,
      canvas: previewRef.current,
    }).catch((error) => {
      if (!cancelled) setPrintError(error.message);
    });

    return () => {
      cancelled = true;
    };
  }, [images, session, filterId]);

  // Kanvas contoh filter ikut dilepas saat panel berganti, jadi digambar ulang.
  useEffect(() => {
    if (!images || stage !== "edit") return;
    FILTERS.forEach((item) => {
      const canvas = swatches.current.get(item.id);
      if (!canvas) return;
      renderFilterSwatch(images[0], item.id, canvas, SWATCH);
      canvas.dataset.ready = "true";
    });
  }, [images, stage]);

  function handleFilter(id) {
    if (stage !== "edit" || id === filterId) return;
    setFilterId(id);
    updatePhotoSession(sessionId, { filterId: id }).catch((error) =>
      console.error("Save filter:", error),
    );
  }

  async function startShare(canvas) {
    shareAbort.current?.abort();
    const controller = new AbortController();
    shareAbort.current = controller;
    setShare({ status: "uploading", step: "compress" });

    try {
      const result = await uploadPhotocard(canvas, {
        signal: controller.signal,
        onStep: (step) => {
          if (!controller.signal.aborted) {
            setShare({ status: "uploading", step });
          }
        },
      });
      if (!controller.signal.aborted) setShare({ status: "ready", ...result });
    } catch (error) {
      if (controller.signal.aborted) return;
      console.error("DTCBooth QR upload:", error);
      setShare({
        status: "error",
        error: error.message || "QR gagal dibuat. Coba lagi.",
      });
    }
  }

  async function handlePrint() {
    if (stage !== "edit" || !images || !session) return;
    setPrintError("");
    setActionError("");
    setFed(false);
    setOutput(null);
    setShare({ status: "uploading", step: "compress" });
    setPrinting(true);

    try {
      const canvas = await renderPhotocard(images, session.frameId, {
        filter: filterId,
        capturedAt: session.createdAt,
        sessionNumber: session.sessionNumber,
      });
      setOutput((previous) => ({
        canvas,
        version: (previous?.version ?? 0) + 1,
      }));
      startShare(canvas);
    } catch (error) {
      setPrinting(false);
      setShare(null);
      setPrintError(error.message || "Photocard gagal dibuat. Coba lagi.");
    }
  }

  function handleBackToEdit() {
    shareAbort.current?.abort();
    setPrinting(false);
    setFed(false);
    setOutput(null);
    setShare(null);
  }

  async function handleDownload() {
    if (!output) return;
    setActionError("");
    try {
      await downloadCanvas(
        output.canvas,
        `DTCBooth-${sessionLabel}-${frame.id}-${filter.id}.jpg`,
      );
    } catch (error) {
      console.error("Download photocard:", error);
      setActionError("JPG gagal disimpan. Coba lagi.");
    }
  }

  async function handlePaper() {
    if (!output || paperBusy) return;
    setActionError("");
    setPaperBusy(true);
    try {
      await printPhotocard(output.canvas);
    } catch (error) {
      console.error("Print photocard:", error);
      setActionError("Dialog cetak gagal dibuka. Coba lagi.");
    } finally {
      setPaperBusy(false);
    }
  }

  return (
    <main
      className={`dtc-page dtc-surface-ink ${styles.page}`}
      data-stage={stage}
    >
      <DtcHeader
        logoPlate
        meta={
          <>
            <span>DTC Booth</span>
            <span>{STAGE_LABEL[stage]}</span>
            <span>Session {sessionLabel}</span>
          </>
        }
      >
        {session && stage !== "printing" && (
          <Link href={frameHref} className={styles.headerLink}>
            Ganti frame
          </Link>
        )}
        <Link href="/" className={styles.headerLink}>
          Keluar
        </Link>
      </DtcHeader>

      {load.status === "error" ? (
        <section className={styles.empty} role="alert">
          <p className="dtc-meta">Sesi tidak ditemukan</p>
          <h1 className={styles.emptyTitle}>No photos here.</h1>
          <p>{load.error}</p>
          <Link href="/" className="dtc-btn dtc-btn--primary dtc-btn--lg">
            <span>Mulai dari awal</span>
            <span className="dtc-btn__arrow">
              <i className="dtc-arrow" aria-hidden="true" />
            </span>
          </Link>
        </section>
      ) : (
        <div className={styles.body}>
          <section className={styles.stage} aria-label="Pratinjau photocard">
            <div className={styles.stageBar}>
              <span>
                {frame.name} · {group?.name}
              </span>
              <span
                className="dtc-status"
                data-state={
                  stage === "printing"
                    ? "live"
                    : stage === "done"
                      ? "active"
                      : undefined
                }
              >
                <i className="dtc-node" />
                {stage === "printing"
                  ? "Developing"
                  : stage === "done"
                    ? "Siap diambil"
                    : "Pratinjau"}
              </span>
            </div>

            <div className={styles.printer}>
              {load.status === "loading" && (
                <p className={styles.loading} role="status">
                  Menyiapkan foto kamu…
                </p>
              )}
              <div className={styles.machine}>
                <div className={styles.feed}>
                  <canvas
                    ref={previewRef}
                    className={`${styles.card} ${
                      stage === "printing" && !fed ? styles.feeding : ""
                    }`}
                    role="img"
                    aria-label={`Photocard ${frame.name}, filter ${filter.name}`}
                    hidden={load.status !== "ready"}
                    onAnimationEnd={(event) => {
                      if (event.target === event.currentTarget) setFed(true);
                    }}
                  />
                </div>
                <div className={styles.slot} aria-hidden="true">
                  <i />
                </div>
              </div>
            </div>

            <dl className={styles.specs}>
              <div>
                <dt>Frame</dt>
                <dd>{frame.name}</dd>
              </div>
              <div>
                <dt>Filter</dt>
                <dd>{filter.name}</dd>
              </div>
              <div>
                <dt>Output</dt>
                <dd>
                  {CARD_SIZE.name} · {CARD_SIZE.width} × {CARD_SIZE.height} px
                </dd>
              </div>
            </dl>
          </section>

          <aside className={styles.panel} aria-label="Pengaturan photocard">
            {stage === "edit" && (
              <>
                <div className={styles.panelBody}>
                  <p className="dtc-meta">[ 06 ] / Final touch</p>
                  <h1 className={styles.title}>
                    Final <span className="dtc-accent">touch.</span>
                  </h1>
                  <p className={styles.lead}>
                    Frame {frame.name} sudah terpasang. Pilih filter foto,
                    grafis kartunya tetap sama.
                  </p>

                  <div
                    className={styles.filters}
                    role="group"
                    aria-labelledby="filter-label"
                  >
                    <p id="filter-label" className="dtc-meta">
                      Filter foto
                    </p>
                    <div className={styles.filterGrid}>
                      {FILTERS.map((item, index) => (
                        <button
                          key={item.id}
                          type="button"
                          className={styles.filter}
                          aria-pressed={filterId === item.id}
                          onClick={() => handleFilter(item.id)}
                        >
                          <span className={styles.swatch}>
                            <canvas
                              ref={(node) => {
                                if (node) swatches.current.set(item.id, node);
                                else swatches.current.delete(item.id);
                              }}
                              aria-hidden="true"
                            />
                          </span>
                          <span className={styles.filterName}>
                            <span>{pad2(index + 1)}</span>
                            {item.name}
                          </span>
                        </button>
                      ))}
                    </div>
                    <p className={styles.filterNote} aria-live="polite">
                      {filter.note}
                    </p>
                  </div>

                  <div className={styles.frameRow}>
                    <div>
                      <span className="dtc-meta">Frame</span>
                      <strong>{frame.name}</strong>
                      <span>
                        {group?.name} · {pad2(count)} foto
                      </span>
                    </div>
                    <Link href={frameHref} className="dtc-btn dtc-btn--sm">
                      <span>Ganti</span>
                    </Link>
                  </div>
                </div>

                <div className={styles.panelFoot}>
                  {printError && (
                    <p className={styles.error} role="alert">
                      {printError}
                    </p>
                  )}
                  <button
                    type="button"
                    className="dtc-btn dtc-btn--primary dtc-btn--lg dtc-btn--block"
                    onClick={handlePrint}
                    disabled={load.status !== "ready"}
                  >
                    <span className="dtc-btn__index">06</span>
                    <span>Buat photocard</span>
                    <span className="dtc-btn__arrow">
                      <i className="dtc-arrow" aria-hidden="true" />
                    </span>
                  </button>
                </div>
              </>
            )}

            {stage === "printing" && (
              <div className={styles.panelBody} role="status">
                <p className="dtc-meta">[ 06 ] / Developing</p>
                <h1 className={styles.title}>
                  Developing<span className="dtc-accent">.</span>
                </h1>
                <p className={styles.lead}>
                  Photocard {frame.name} dengan filter {filter.name} lagi
                  disusun dalam ukuran {CARD_SIZE.name}, {CARD_SIZE.width} ×{" "}
                  {CARD_SIZE.height} px.
                </p>
                <div className={styles.progress} aria-hidden="true">
                  <i />
                </div>
              </div>
            )}

            {stage === "done" && (
              <div className={styles.panelBody}>
                <p className="dtc-meta">[ 07 ] / Take it home</p>
                <h1 className={`${styles.title} ${styles.titleCompact}`}>
                  Take it <span className="dtc-accent">home.</span>
                </h1>
                <p className={styles.lead}>
                  Ukurannya {CARD_SIZE.name} ({CARD_SIZE.inches}), siap dicetak.
                  Versi digitalnya bisa kamu unduh lewat QR, disimpan sementara
                  di laptop booth.
                </p>

                <QrTicket
                  key={output.version}
                  share={share ?? { status: "uploading" }}
                  details={{ frame: frame.name, session: sessionLabel }}
                  onRetry={() => startShare(output.canvas)}
                />

                <div className={styles.doneActions}>
                  <button
                    type="button"
                    className="dtc-btn dtc-btn--block"
                    onClick={handlePaper}
                    disabled={paperBusy}
                  >
                    <span>
                      {paperBusy
                        ? "Membuka dialog cetak…"
                        : `Cetak ${CARD_SIZE.name}`}
                    </span>
                    <span className="dtc-btn__arrow">
                      <i className="dtc-arrow" aria-hidden="true" />
                    </span>
                  </button>
                  <button
                    type="button"
                    className="dtc-btn dtc-btn--block"
                    onClick={handleDownload}
                  >
                    <span>Simpan ke laptop</span>
                    <span className="dtc-btn__arrow">
                      <i
                        className="dtc-arrow dtc-arrow--down"
                        aria-hidden="true"
                      />
                    </span>
                  </button>
                  <button
                    type="button"
                    className="dtc-btn dtc-btn--block"
                    onClick={handleBackToEdit}
                  >
                    <span>Ubah filter</span>
                    <span className="dtc-btn__arrow">
                      <i
                        className="dtc-arrow dtc-arrow--back"
                        aria-hidden="true"
                      />
                    </span>
                  </button>
                </div>
                {actionError && (
                  <p className={styles.error} role="alert">
                    {actionError}
                  </p>
                )}

                <NextVisitorButton sessionId={sessionId} qrReady={qrReady} />
              </div>
            )}
          </aside>
        </div>
      )}
    </main>
  );
}
