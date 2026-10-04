/** @format */

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { pad2 } from "../../data/formats";
import {
  CARD_SIZE,
  CATEGORIES,
  DEFAULT_DESIGN,
  PHOTOCARDS,
  getPhotocard,
  loadPhotos,
  renderPhotocard,
} from "../../lib/photocard";
import { getPhotoSession, updatePhotoSession } from "../../lib/photoStorage";
import DtcHeader from "../brand/DtcHeader";
import styles from "./frame.module.css";

const LAYOUT_NAMES = {
  auto: "Strip / grid",
  grid: "Grid",
  feature: "Foto utama + sisipan",
  film: "Rol film",
  polaroid: "Polaroid",
  collage: "Kolase",
  magazine: "Sampul",
  strip: "2 strip per lembar",
};
const THUMB_SCALE = 0.2;
const PREVIEW_SCALE = 0.6;

const nextFrame = () =>
  new Promise((resolve) => requestAnimationFrame(resolve));

export default function FramePicker({ sessionId }) {
  const router = useRouter();
  const thumbs = useRef(new Map());
  const previewRef = useRef(null);

  const [state, setState] = useState({ status: "loading", error: "" });
  const [session, setSession] = useState(null);
  const [images, setImages] = useState(null);
  const [selected, setSelected] = useState(DEFAULT_DESIGN);
  const [category, setCategory] = useState("all");
  const [saving, setSaving] = useState(false);

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
        setImages(loaded);
        setState({ status: "ready", error: "" });
      } catch (error) {
        if (cancelled) return;
        setState({
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

  const options = useMemo(
    () => ({
      capturedAt: session?.createdAt,
      sessionNumber: session?.sessionNumber,
      filter: session?.filterId,
    }),
    [session],
  );

  // Thumbnail dirender satu per satu supaya layar tidak tersendat.
  useEffect(() => {
    if (!images) return undefined;
    let cancelled = false;

    (async () => {
      for (const card of PHOTOCARDS) {
        if (cancelled) return;
        const canvas = thumbs.current.get(card.id);
        if (!canvas) continue;
        await renderPhotocard(images, card.id, {
          ...options,
          scale: THUMB_SCALE,
          canvas,
        });
        canvas.dataset.ready = "true";
        await nextFrame();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [images, options]);

  useEffect(() => {
    if (!images || !previewRef.current) return;
    renderPhotocard(images, selected, {
      ...options,
      scale: PREVIEW_SCALE,
      canvas: previewRef.current,
    });
  }, [images, selected, options]);

  async function handleContinue() {
    if (saving) return;
    setSaving(true);
    try {
      await updatePhotoSession(sessionId, { frameId: selected });
      router.push(`/editor?session=${encodeURIComponent(sessionId)}`);
    } catch (error) {
      setSaving(false);
      setState({
        status: "ready",
        error: error.message || "Pilihan frame gagal disimpan.",
      });
    }
  }

  const card = PHOTOCARDS.find((item) => item.id === selected) ?? PHOTOCARDS[0];
  const cardIndex = PHOTOCARDS.indexOf(card);
  const group = CATEGORIES.find((item) => item.id === card.category);
  const count = session?.photos?.length ?? 0;
  const sessionLabel = session?.sessionNumber
    ? String(session.sessionNumber).padStart(3, "0")
    : "---";

  return (
    <main className={`dtc-page dtc-surface-ink ${styles.page}`}>
      <DtcHeader
        logoPlate
        meta={
          <>
            <span>DTC Booth</span>
            <span>Choose frame</span>
            <span>Session {sessionLabel}</span>
          </>
        }
      >
        <Link href="/" className={styles.exit}>
          Keluar
        </Link>
      </DtcHeader>

      {state.status === "error" && !session ? (
        <section className={styles.empty} role="alert">
          <p className="dtc-meta">Sesi tidak ditemukan</p>
          <h1 className={styles.emptyTitle}>No photos here.</h1>
          <p>{state.error}</p>
          <Link href="/" className="dtc-btn dtc-btn--primary dtc-btn--lg">
            <span>Mulai dari awal</span>
            <span className="dtc-btn__arrow">
              <i className="dtc-arrow" aria-hidden="true" />
            </span>
          </Link>
        </section>
      ) : (
        <div className={styles.body}>
          <section className={styles.gallery} aria-labelledby="frame-title">
            <div className={styles.head}>
              <p className="dtc-meta">
                [ 05 ] / {PHOTOCARDS.length} photocards
              </p>
              <h1 id="frame-title" className={styles.title}>
                <span>Choose your</span>{" "}
                <span className="dtc-accent">frame.</span>
              </h1>
              <p className={styles.lead}>
                Semua desain di bawah sudah memakai {count || "…"} foto kamu.
                Pilih satu, filter dan hasil akhirnya diatur di langkah
                berikutnya.
              </p>
            </div>

            <div className={styles.tabs} role="group" aria-label="Kategori">
              {[{ id: "all", name: "Semua" }, ...CATEGORIES].map((item) => {
                const total =
                  item.id === "all"
                    ? PHOTOCARDS.length
                    : PHOTOCARDS.filter((entry) => entry.category === item.id)
                        .length;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={styles.tab}
                    aria-pressed={category === item.id}
                    onClick={() => setCategory(item.id)}
                  >
                    {item.name}
                    <span>{pad2(total)}</span>
                  </button>
                );
              })}
            </div>

            <div className={styles.grid}>
              {PHOTOCARDS.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  className={styles.tile}
                  aria-pressed={selected === item.id}
                  hidden={category !== "all" && item.category !== category}
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
                  <span className={styles.tileMeta}>
                    {pad2(index + 1)} ·{" "}
                    {
                      CATEGORIES.find((entry) => entry.id === item.category)
                        ?.name
                    }
                  </span>
                </button>
              ))}
            </div>

            <div className={styles.mobileBar}>
              <p>
                <span className="dtc-meta">Frame</span>
                <strong>{card.name}</strong>
              </p>
              <button
                type="button"
                className="dtc-btn dtc-btn--primary"
                onClick={handleContinue}
                disabled={state.status !== "ready" || saving}
              >
                <span>{saving ? "Menyimpan…" : "Pakai"}</span>
                <span className="dtc-btn__arrow">
                  <i className="dtc-arrow" aria-hidden="true" />
                </span>
              </button>
            </div>
          </section>

          <aside className={styles.preview} aria-label="Pratinjau photocard">
            <div className={styles.stage}>
              <div className={styles.stageBar}>
                <span>
                  {pad2(cardIndex + 1)} / {pad2(PHOTOCARDS.length)}
                </span>
                <span className="dtc-tag dtc-tag--accent">{group?.name}</span>
              </div>
              {state.status === "loading" && (
                <p className={styles.loading} role="status">
                  Menyiapkan foto kamu…
                </p>
              )}
              <canvas
                ref={previewRef}
                className={styles.previewCanvas}
                role="img"
                aria-label={`Pratinjau photocard ${card.name}`}
                hidden={state.status === "loading"}
              />
              <dl className={styles.specs}>
                <div>
                  <dt>Foto</dt>
                  <dd>{pad2(count)}</dd>
                </div>
                <div>
                  <dt>Layout</dt>
                  <dd>{LAYOUT_NAMES[card.layout]}</dd>
                </div>
                <div>
                  <dt>Output</dt>
                  <dd>
                    {CARD_SIZE.name} · {CARD_SIZE.inches}
                  </dd>
                </div>
              </dl>
            </div>

            <div className={styles.info}>
              <h2 className={styles.cardName}>{card.name}</h2>
              <p className={styles.cardNote}>{card.note}</p>
              <button
                type="button"
                className="dtc-btn dtc-btn--primary dtc-btn--lg dtc-btn--block"
                onClick={handleContinue}
                disabled={state.status !== "ready" || saving}
              >
                <span className="dtc-btn__index">05</span>
                <span>{saving ? "Menyimpan…" : "Pakai frame ini"}</span>
                <span className="dtc-btn__arrow">
                  <i className="dtc-arrow" aria-hidden="true" />
                </span>
              </button>
              {state.error && session && (
                <p className={styles.error} role="alert">
                  {state.error}
                </p>
              )}
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
