/** @format */

"use client";

import { useEffect, useRef, useState } from "react";
import { FORMATS, estimateSeconds, getFormat, pad2 } from "../../data/formats";
import useWarmGestureAI from "../../hooks/useWarmGestureAI";
import { unlockBoothAudio } from "../../lib/boothAudio";
import { useSessionNumber } from "../../lib/sessionCounter";
import { setSkipTutorial, useSkipTutorial } from "../../lib/tutorialPreference";
import Magnetic from "../motion/Magnetic";
import ShutterLink from "../motion/ShutterLink";
import styles from "./landing.module.css";

function useTweenedNumber(target, duration = 320) {
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);

  useEffect(() => {
    const from = fromRef.current;
    const start = performance.now();
    let raf = requestAnimationFrame(function step(now) {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - progress) ** 3;
      const next = Math.round(from + (target - from) * eased);
      fromRef.current = next;
      setValue(next);
      if (progress < 1) raf = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}

export default function SessionSetup() {
  const [count, setCount] = useState(3);
  const session = useSessionNumber();
  const skipTutorial = useSkipTutorial();
  const seconds = useTweenedNumber(estimateSeconds(count));
  const format = getFormat(count);
  // Tanpa tutorial, landing langsung ke booth: siapkan model di sini.
  useWarmGestureAI(skipTutorial);

  return (
    <section
      id="session"
      className={styles.session}
      aria-labelledby="session-title"
    >
      <div className={`dtc-grid ${styles.sessionHead}`}>
        <p className={`dtc-meta ${styles.sessionLabel}`}>[ 03 ] / Start here</p>
        <h2
          id="session-title"
          className={`dtc-display dtc-on-scroll ${styles.sessionTitle}`}
        >
          <span>Pick your</span>
          <span className="dtc-accent">format.</span>
        </h2>
        <p className={`dtc-body ${styles.sessionNote}`}>
          Pilih jumlah foto untuk satu sesi. Desain photocard-nya kamu pilih
          setelah fotonya jadi, jadi bisa lihat hasilnya dulu.
        </p>
      </div>

      <div className={`dtc-grid ${styles.sessionBody}`}>
        <fieldset className={styles.formats}>
          <legend className="dtc-visually-hidden">Jumlah foto per sesi</legend>
          {FORMATS.map((item) => (
            <label
              key={item.count}
              className={styles.format}
              data-cursor={`${item.count} foto`}
            >
              <input
                type="radio"
                name="format"
                value={item.count}
                checked={count === item.count}
                onChange={() => setCount(item.count)}
                className="dtc-visually-hidden"
              />
              <span className={styles.formatTop}>
                <span className={styles.formatNumber}>{pad2(item.count)}</span>
                <i
                  className={`dtc-node ${styles.formatNode}`}
                  aria-hidden="true"
                />
              </span>
              <span
                className={styles.formatDiagram}
                data-count={item.count}
                aria-hidden="true"
              >
                {Array.from({ length: item.count }, (_, index) => (
                  <i key={index} />
                ))}
              </span>
              <span className={styles.formatName}>{item.name}</span>
              <span className={styles.formatNote}>
                {item.count} foto · {item.note}
              </span>
            </label>
          ))}
        </fieldset>

        <aside
          className={`dtc-surface-ink ${styles.summary}`}
          aria-label="Ringkasan sesi"
        >
          <div className={styles.summaryTop}>
            <span className="dtc-meta">Session / {session}</span>
            <span className="dtc-status" data-state="active">
              <i className="dtc-node" /> Ready
            </span>
          </div>
          <p className={styles.summaryFormat} aria-live="polite">
            <span className="dtc-meta">Format</span>
            <strong>
              {pad2(count)} / {format.name}
            </strong>
          </p>
          <dl className={styles.summaryList}>
            <div>
              <dt className="dtc-meta">Foto</dt>
              <dd>{count}</dd>
            </div>
            <div>
              <dt className="dtc-meta">Estimasi</dt>
              <dd className="dtc-tabular">± {seconds} detik</dd>
            </div>
            <div>
              <dt className="dtc-meta">Photocard</dt>
              <dd>Dipilih setelah foto</dd>
            </div>
          </dl>
          <Magnetic className={styles.fullWidth} max={6}>
            <ShutterLink
              href={`/${skipTutorial ? "booth" : "tutorial"}?photos=${count}`}
              onClick={() => unlockBoothAudio().catch(() => {})}
              className="dtc-btn dtc-btn--primary dtc-btn--lg dtc-btn--block"
              data-cursor={skipTutorial ? "Start" : "Next"}
            >
              <span className="dtc-btn__index">02</span>
              <span>
                {skipTutorial ? "Start camera" : "Lanjut ke tutorial"}
              </span>
              <span className="dtc-btn__arrow">
                <i className="dtc-arrow" aria-hidden="true" />
              </span>
            </ShutterLink>
          </Magnetic>
          {skipTutorial ? (
            <p className={styles.summaryNote}>
              Tutorial dilewati untuk sesi ini.{" "}
              <button
                type="button"
                className={styles.summaryReset}
                onClick={() => setSkipTutorial(false)}
              >
                Tampilkan lagi
              </button>
            </p>
          ) : (
            <p className={styles.summaryNote}>
              Setelah tutorial singkat, kamera baru menyala.
            </p>
          )}
        </aside>
      </div>
    </section>
  );
}
