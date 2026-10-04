/** @format */

import HandGlyph from "../gestures/HandGlyph";
import styles from "./landing.module.css";

function IconCards() {
  return (
    <svg viewBox="0 0 64 64" className={styles.stepIcon} aria-hidden="true">
      <rect
        x="10"
        y="12"
        width="24"
        height="40"
        transform="rotate(-8 22 32)"
        className={styles.iconMuted}
      />
      <g transform="rotate(5 40 32)">
        <rect x="28" y="8" width="24" height="46" className={styles.iconFill} />
        <rect x="31.5" y="12" width="17" height="11" />
        <rect
          x="31.5"
          y="26"
          width="17"
          height="11"
          className={styles.iconAccent}
        />
        <rect x="31.5" y="40" width="17" height="10" />
      </g>
    </svg>
  );
}

function IconFrame() {
  return (
    <svg viewBox="0 0 64 64" className={styles.stepIcon} aria-hidden="true">
      <path
        d="M5 17V6h11M48 6h11v11M59 47v11H48M16 58H5V47"
        className={styles.iconAccent}
      />
      <circle cx="21" cy="29" r="5" />
      <path d="M12 49c0-6 4-10 9-10s9 4 9 10" />
      <circle cx="43" cy="29" r="5" />
      <path d="M34 49c0-6 4-10 9-10s9 4 9 10" />
      <circle cx="32" cy="25" r="5.5" className={styles.iconFill} />
      <path
        d="M22 49c0-7 4.5-11.5 10-11.5S42 42 42 49"
        className={styles.iconFill}
      />
    </svg>
  );
}

function IconHand() {
  return <HandGlyph pose="peace" className={styles.stepIcon} />;
}

function IconQr() {
  return (
    <svg viewBox="0 0 64 64" className={styles.stepIcon} aria-hidden="true">
      <rect x="17" y="5" width="30" height="54" rx="4" />
      <path d="M28 53h8" />
      <rect x="23" y="15" width="7" height="7" />
      <rect x="34" y="15" width="7" height="7" />
      <rect x="23" y="26" width="7" height="7" />
      <path d="M34 26h3v3h-3zM38 30h3v3h-3zM34 34h7" />
      <path d="M11 38h42" className={styles.iconAccent} />
    </svg>
  );
}

const STEPS = [
  {
    number: "01",
    title: "Pilih photo card",
    text: "Tentukan mau berapa foto. Desain photocard-nya masih bisa diganti setelah fotonya jadi.",
    meta: "1–6 foto",
    Icon: IconCards,
  },
  {
    number: "02",
    title: "Masuk ke frame",
    text: "Berdiri di depan kamera sampai semua orang kelihatan. Sendiri, berdua, atau satu geng.",
    meta: "Sendiri sampai rombongan",
    Icon: IconFrame,
  },
  {
    number: "03",
    title: "Gunakan hand sign",
    text: "Angkat tangan, tunjukkan peace, jempol, atau salam lain. Tahan sampai terkunci, hitungan mundur jalan sendiri.",
    meta: "Tahan ± 1 dtk · 3–2–1",
    Icon: IconHand,
  },
  {
    number: "04",
    title: "Scan QR & download",
    text: "Pilih desain akhir, lalu scan QR pakai kamera HP. Fotonya langsung bisa disimpan.",
    meta: "Link aktif 24 jam",
    Icon: IconQr,
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how"
      className={`dtc-surface-dark ${styles.how}`}
      aria-labelledby="how-title"
    >
      <div className={`dtc-grid ${styles.howHead}`}>
        <p className={`dtc-meta ${styles.howLabel}`}>[ 02 ] / How it works</p>
        <h2
          id="how-title"
          className={`dtc-display dtc-on-scroll ${styles.howTitle}`}
        >
          <span>04 steps.</span>
          <span className="dtc-accent">One memory.</span>
        </h2>
        <p className={`dtc-lead ${styles.howLead}`}>
          Dari datang sampai foto ada di HP, cuma sekitar satu menit. Nggak ada
          tombol kamera yang perlu dipencet.
        </p>
      </div>

      <div className={styles.diagram}>
        <span className={styles.track} aria-hidden="true">
          <i />
        </span>
        <ol className={`dtc-grid ${styles.steps}`}>
          {STEPS.map(({ number, title, text, meta, Icon }) => (
            <li key={number} className={`dtc-on-scroll ${styles.step}`}>
              <span className={styles.stepNode} aria-hidden="true" />
              <div className={styles.stepHead}>
                <span
                  className={`dtc-outline ${styles.stepNumber}`}
                  aria-hidden="true"
                >
                  {number}
                </span>
                <Icon />
              </div>
              <h3 className={styles.stepTitle}>
                <span className="dtc-visually-hidden">Langkah {number}: </span>
                {title}
              </h3>
              <p className={styles.stepText}>{text}</p>
              <span className={`dtc-tag dtc-tag--accent ${styles.stepMeta}`}>
                {meta}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
