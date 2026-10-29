/** @format */

import HandGlyph from "../gestures/HandGlyph";
import styles from "./landing.module.css";

function IconCount() {
  return (
    <svg viewBox="0 0 48 48" className={styles.stepIcon} aria-hidden="true">
      <rect x="10" y="6" width="28" height="36" />
      <path d="M14 12h20v8H14zM14 24h20v8H14z" className={styles.iconRed} />
    </svg>
  );
}

function IconDistance() {
  return (
    <svg viewBox="0 0 48 48" className={styles.stepIcon} aria-hidden="true">
      <rect x="4" y="16" width="12" height="10" />
      <circle cx="36" cy="14" r="5" />
      <path d="M28 42v-8c0-5 3.5-8 8-8s8 3 8 8v8" />
      <path d="M4 40h40M16 34h12M16 31v6M28 31v6" className={styles.iconRed} />
    </svg>
  );
}

function IconQr() {
  return (
    <svg viewBox="0 0 48 48" className={styles.stepIcon} aria-hidden="true">
      <rect x="12" y="4" width="24" height="40" rx="3" />
      <path d="M17 12h6v6h-6zM25 12h6v6h-6zM17 20h6v6h-6zM25 20h3v3h-3zM28 23h3v3h-3z" className={styles.iconRed} />
      <path d="M21 38h6" />
    </svg>
  );
}

function IconHand() {
  return <HandGlyph pose="peace" className={styles.stepIcon} />;
}

const STEPS = [
  {
    title: "Pilih jumlah foto",
    text: "1 sampai 6 foto. Desain photocard dipilih setelah fotonya jadi.",
    Icon: IconCount,
  },
  {
    title: "Berdiri 1–2 meter",
    text: "Pastikan semua wajah terlihat di layar. Sendiri, berdua, atau satu geng.",
    Icon: IconDistance,
  },
  {
    title: "Tunjukkan hand sign",
    text: "Peace, jempol, atau salam lain. Tahan sebentar, hitungan mundur jalan sendiri.",
    Icon: IconHand,
  },
  {
    title: "Scan QR",
    text: "Pilih desain, lalu scan QR pakai kamera HP. Link aktif 24 jam.",
    Icon: IconQr,
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className={styles.how} aria-labelledby="how-title">
      <h2 id="how-title" className="cia-label cia-kicker">
        Cara kerja · ± 1 menit
      </h2>
      <ol className={styles.steps}>
        {STEPS.map(({ title, text, Icon }, index) => (
          <li key={title} className={styles.step}>
            <span className={styles.stepNumber}>0{index + 1}</span>
            <Icon />
            <h3 className={styles.stepTitle}>{title}</h3>
            <p className={styles.stepText}>{text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
