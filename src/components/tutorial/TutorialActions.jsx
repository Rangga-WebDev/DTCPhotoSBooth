/** @format */

"use client";

import { useState } from "react";
import { estimateSeconds, getFormat, pad2 } from "../../data/formats";
import useWarmGestureAI from "../../hooks/useWarmGestureAI";
import { unlockBoothAudio } from "../../lib/boothAudio";
import { useSessionNumber } from "../../lib/sessionCounter";
import { setSkipTutorial } from "../../lib/tutorialPreference";
import Magnetic from "../motion/Magnetic";
import ShutterLink from "../motion/ShutterLink";
import styles from "./tutorial.module.css";

export default function TutorialActions({ count }) {
  const [skip, setSkip] = useState(false);
  const session = useSessionNumber();
  const format = getFormat(count);
  useWarmGestureAI();

  return (
    <div className={`dtc-surface-ink dtc-actionbar ${styles.actions}`}>
      <p className={`dtc-meta dtc-slashes ${styles.actionsMeta}`}>
        <span>Session {session}</span>
        <span>
          {pad2(count)} {format.name}
        </span>
        <span>± {estimateSeconds(count)} detik</span>
      </p>

      <label className={styles.skip} data-cursor="Skip">
        <input
          type="checkbox"
          className="dtc-visually-hidden"
          checked={skip}
          onChange={(event) => setSkip(event.target.checked)}
        />
        <span className={styles.skipBox} aria-hidden="true" />
        <span className={styles.skipText}>
          Jangan tampilkan lagi
          <small>Sampai pengunjung berikutnya</small>
        </span>
      </label>

      <Magnetic className={styles.cta} max={6}>
        <ShutterLink
          href={`/booth?photos=${count}`}
          onClick={() => {
            setSkipTutorial(skip);
            // Klik ini dihitung gestur pengguna, jadi beep countdown langsung aktif di booth.
            unlockBoothAudio().catch(() => {});
          }}
          className="dtc-btn dtc-btn--primary dtc-btn--lg dtc-btn--block"
          data-cursor="Start"
        >
          <span className="dtc-btn__index">03</span>
          <span>
            Saya mengerti
            <span className={styles.ctaExtra}>&nbsp;/ Start camera</span>
          </span>
          <span className="dtc-btn__arrow">
            <i className="dtc-arrow" aria-hidden="true" />
          </span>
        </ShutterLink>
      </Magnetic>
    </div>
  );
}
