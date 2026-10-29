/** @format */

"use client";

import Link from "next/link";
import { useState } from "react";

import useWarmGestureAI from "../../hooks/useWarmGestureAI";
import { unlockBoothAudio } from "../../lib/boothAudio";
import { setSkipTutorial } from "../../lib/tutorialPreference";
import Icon from "../brand/Icon";
import styles from "./tutorial.module.css";

export default function TutorialActions({ count }) {
  const [skip, setSkip] = useState(false);
  // Model AI dimuat di worker selama pengunjung membaca tutorial.
  useWarmGestureAI();

  return (
    <div className={styles.actions}>
      <label className={styles.skip}>
        <input type="checkbox" checked={skip} onChange={(event) => setSkip(event.target.checked)} />
        <span>
          Jangan tampilkan lagi
          <small>Sampai pengunjung berikutnya</small>
        </span>
      </label>

      <Link
        href={`/booth?photos=${count}`}
        onClick={() => {
          setSkipTutorial(skip);
          // Klik ini dihitung gestur pengguna, jadi beep countdown langsung aktif di booth.
          unlockBoothAudio().catch(() => {});
        }}
        className={`cia-btn cia-btn--primary cia-btn--lg ${styles.cta}`}
      >
        Saya mengerti, nyalakan kamera
        <Icon name="arrow" />
      </Link>
    </div>
  );
}
