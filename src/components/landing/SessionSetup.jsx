/** @format */

"use client";

import Link from "next/link";
import { useState } from "react";

import { FORMATS, estimateSeconds, getFormat } from "../../data/formats";
import useWarmGestureAI from "../../hooks/useWarmGestureAI";
import { unlockBoothAudio } from "../../lib/boothAudio";
import { useSessionNumber } from "../../lib/sessionCounter";
import { setSkipTutorial, useSkipTutorial } from "../../lib/tutorialPreference";
import Icon from "../brand/Icon";
import styles from "./landing.module.css";

export default function SessionSetup() {
  const [count, setCount] = useState(3);
  const session = useSessionNumber();
  const skipTutorial = useSkipTutorial();
  const format = getFormat(count);
  // Tanpa tutorial, landing langsung ke booth: siapkan model AI di sini.
  useWarmGestureAI(skipTutorial);

  return (
    <section id="session" className={styles.setup} aria-labelledby="session-title">
      <div className={styles.setupHead}>
        <h2 id="session-title" className="cia-heading">
          Pilih jumlah foto
        </h2>
        <span className="cia-label cia-tnum">Sesi {session}</span>
      </div>

      <fieldset className={styles.formats}>
        <legend className="cia-visually-hidden">Jumlah foto per sesi</legend>
        {FORMATS.map((item) => (
          <label key={item.count} className={styles.format}>
            <input
              type="radio"
              name="format"
              value={item.count}
              checked={count === item.count}
              onChange={() => setCount(item.count)}
              className="cia-visually-hidden"
            />
            <span className={styles.formatNumber}>{item.count}</span>
            <span className={styles.formatDiagram} data-count={item.count} aria-hidden="true">
              {Array.from({ length: item.count }, (_, index) => (
                <i key={index} />
              ))}
            </span>
            <span className={styles.formatName}>{item.name}</span>
          </label>
        ))}
      </fieldset>

      <dl className={styles.summary} aria-live="polite">
        <div>
          <dt className="cia-label">Format</dt>
          <dd>
            {count} foto · {format.note}
          </dd>
        </div>
        <div>
          <dt className="cia-label">Estimasi</dt>
          <dd className="cia-tnum">± {estimateSeconds(count)} detik</dd>
        </div>
      </dl>

      <Link
        href={`/${skipTutorial ? "booth" : "tutorial"}?photos=${count}`}
        onClick={() => unlockBoothAudio().catch(() => {})}
        className="cia-btn cia-btn--primary cia-btn--lg cia-btn--block"
      >
        {skipTutorial ? "Nyalakan kamera" : "Mulai photobooth"}
        <Icon name="arrow" />
      </Link>

      {skipTutorial ? (
        <p className={styles.setupNote}>
          Tutorial dilewati untuk sesi ini.{" "}
          <button type="button" className={styles.textButton} onClick={() => setSkipTutorial(false)}>
            Tampilkan lagi
          </button>
        </p>
      ) : (
        <p className={styles.setupNote}>Ada tutorial singkat sebelum kamera menyala.</p>
      )}
    </section>
  );
}
