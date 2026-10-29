/** @format */

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  CARD_SIZE,
  DEFAULT_DESIGN,
  DEFAULT_FILTER,
  FILTERS,
  PHOTOCARDS,
  getFilter,
  getPhotocard,
  loadPhotos,
  renderFilterSwatch,
  renderPhotocard,
} from "../../lib/photocard";
import { getPhotoSession, updatePhotoSession } from "../../lib/photoStorage";
import Icon from "../brand/Icon";
import SiteHeader from "../brand/SiteHeader";
import styles from "./frame.module.css";

const THUMB_SCALE = 0.2;
const PREVIEW_SCALE = 0.5;
const SWATCH = { width: 160, height: 100 };

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));

export default function FramePicker({ sessionId }) {
  const router = useRouter();
  const thumbs = useRef(new Map());
  const swatches = useRef(new Map());
  const previewRef = useRef(null);

  const [load, setLoad] = useState({ status: "loading", error: "" });
  const [session, setSession] = useState(null);
  const [images, setImages] = useState(null);
  const [selected, setSelected] = useState(DEFAULT_DESIGN);
  const [filterId, setFilterId] = useState(DEFAULT_FILTER);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

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
        loaded = await loadPhotos(saved.photos, { resizeWidth: 1280 });
        if (cancelled) return;
        setSession(saved);
        setSelected(getPhotocard(saved.frameId).id);
        setFilterId(getFilter(saved.filterId).id);
        setImages(loaded);
        setLoad({ status: "ready", error: "" });
      } catch (error) {
        if (cancelled) return;
        setLoad({ status: "error", error: error.message || "Sesi foto gagal dibuka." });
      }
    })();

    return () => {
      cancelled = true;
      loaded.forEach((image) => image.close?.());
    };
  }, [sessionId]);

  const stampOptions = useMemo(
    () => ({ capturedAt: session?.createdAt, sessionNumber: session?.sessionNumber }),
    [session],
  );

  // Thumbnail & contoh filter dirender satu per satu supaya layar tidak tersendat.
  useEffect(() => {
    if (!images) return undefined;
    let cancelled = false;

    (async () => {
      FILTERS.forEach((item) => {
        const canvas = swatches.current.get(item.id);
        if (canvas) renderFilterSwatch(images[0], item.id, canvas, SWATCH);
      });
      for (const card of PHOTOCARDS) {
        if (cancelled) return;
        const canvas = thumbs.current.get(card.id);
        if (!canvas) continue;
        await renderPhotocard(images, card.id, { ...stampOptions, scale: THUMB_SCALE, canvas });
        canvas.dataset.ready = "true";
        await nextFrame();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [images, stampOptions]);

  useEffect(() => {
    if (!images || !previewRef.current) return;
    renderPhotocard(images, selected, {
      ...stampOptions,
      filter: filterId,
      scale: PREVIEW_SCALE,
      canvas: previewRef.current,
    }).catch((error) => console.error("Preview photocard:", error));
  }, [images, selected, filterId, stampOptions]);

  async function handleContinue() {
    if (saving) return;
    setSaving(true);
    setSaveError("");
    try {
      await updatePhotoSession(sessionId, { frameId: selected, filterId });
      router.push(`/editor?session=${encodeURIComponent(sessionId)}`);
    } catch (error) {
      setSaving(false);
      setSaveError(error.message || "Pilihan desain gagal disimpan.");
    }
  }

  const card = getPhotocard(selected);
  const filter = getFilter(filterId);
  const count = session?.photos?.length ?? 0;
  const sessionLabel = session?.sessionNumber
    ? String(session.sessionNumber).padStart(3, "0")
    : "---";

  return (
    <main className={`cia-page ${styles.page}`}>
      <SiteHeader
        meta={
          <>
            <span className="cia-label cia-tnum">Sesi {sessionLabel}</span>
            <span className="cia-label">Langkah 2 / 3 · Desain</span>
          </>
        }
      >
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
          <section className={styles.preview} aria-label="Pratinjau photocard">
            {load.status === "loading" && (
              <p className={styles.loading} role="status">
                Menyiapkan foto kamu…
              </p>
            )}
            <canvas
              ref={previewRef}
              className={styles.previewCanvas}
              role="img"
              aria-label={`Pratinjau photocard ${card.name}, filter ${filter.name}`}
              hidden={load.status !== "ready"}
            />
            <p className={styles.previewMeta}>
              {card.name} · {filter.name} · {CARD_SIZE.name} {CARD_SIZE.inches}
            </p>
          </section>

          <section className={styles.options} aria-labelledby="frame-title">
            <div className={styles.head}>
              <p className="cia-label cia-kicker">Langkah 2 · Desain photocard</p>
              <h1 id="frame-title" className={`cia-display ${styles.title}`}>
                Pilih <span className="cia-red">desain.</span>
              </h1>
              <p className={styles.lead}>
                Semua desain sudah memakai {count || "…"} foto kamu. Pilih satu desain dan
                filter, lalu lanjut ke QR.
              </p>
            </div>

            <div className={styles.group}>
              <p className="cia-label">Desain</p>
              <div className={styles.grid} role="group" aria-label="Desain photocard">
                {PHOTOCARDS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={styles.tile}
                    aria-pressed={selected === item.id}
                    onClick={() => setSelected(item.id)}
                  >
                    <span className={styles.thumb}>
                      <canvas
                        ref={(node) => {
                          if (node) thumbs.current.set(item.id, node);
                          else thumbs.current.delete(item.id);
                        }}
                        aria-hidden="true"
                      />
                    </span>
                    <span className={styles.tileName}>{item.name}</span>
                  </button>
                ))}
              </div>
              <p className={styles.note}>{card.note}</p>
            </div>

            <div className={styles.group}>
              <p className="cia-label">Filter foto</p>
              <div className={styles.filters} role="group" aria-label="Filter foto">
                {FILTERS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={styles.filter}
                    aria-pressed={filterId === item.id}
                    onClick={() => setFilterId(item.id)}
                  >
                    <canvas
                      ref={(node) => {
                        if (node) swatches.current.set(item.id, node);
                        else swatches.current.delete(item.id);
                      }}
                      aria-hidden="true"
                    />
                    <span>{item.name}</span>
                  </button>
                ))}
              </div>
              <p className={styles.note}>{filter.note}</p>
            </div>

            <div className={styles.actions}>
              {saveError && (
                <p className="cia-error" role="alert">
                  {saveError}
                </p>
              )}
              <button
                type="button"
                className="cia-btn cia-btn--primary cia-btn--lg cia-btn--block"
                onClick={handleContinue}
                disabled={load.status !== "ready" || saving}
              >
                {saving ? "Menyimpan…" : "Pakai desain ini"}
                <Icon name="arrow" />
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
