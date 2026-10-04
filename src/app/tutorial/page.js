/** @format */

import Link from "next/link";
import DtcHeader from "../../components/brand/DtcHeader";
import HandGlyph from "../../components/gestures/HandGlyph";
import CustomCursor from "../../components/motion/CustomCursor";
import DistanceDiagram from "../../components/tutorial/DistanceDiagram";
import TutorialActions from "../../components/tutorial/TutorialActions";
import styles from "../../components/tutorial/tutorial.module.css";
import {
  estimateSeconds,
  getFormat,
  pad2,
  parsePhotoCount,
} from "../../data/formats";
import { GESTURES } from "../../data/gestures";

export const metadata = {
  title: "Tutorial · DTCBooth",
};

const ZONES = [
  {
    range: "< 1 m",
    name: "Terlalu dekat",
    text: "Kepala atau tangan gampang kepotong frame.",
  },
  {
    range: "1–2 m",
    name: "Ideal",
    text: "Badan masuk frame, tangan kebaca jelas.",
    ideal: true,
  },
  {
    range: "> 2 m",
    name: "Kejauhan",
    text: "Tangan makin kecil di kamera, gestur makin susah kebaca.",
  },
];

const TIPS = [
  {
    title: "Cahaya dari depan",
    text: "Jangan berdiri membelakangi lampu atau jendela yang terang.",
  },
  {
    title: "Cukup satu yang kasih kode",
    text: "Kamera membaca maksimal 2 tangan sekaligus. Yang lain bebas pose.",
  },
  {
    title: "Wajah tetap kelihatan",
    text: "Angkat tangan di samping badan, jangan sampai menutupi muka.",
  },
];

function buildSteps(count) {
  return [
    {
      title: "Masuk ke frame",
      text: "Berdiri sekitar 1–2 meter dari kamera sampai semua wajah kelihatan di layar.",
      spec: "Jarak 1–2 m",
    },
    {
      title: "Tunjukkan hand sign",
      text: "Angkat tangan setinggi dada atau bahu, telapak menghadap kamera. Pakai salah satu dari 9 gestur di bawah.",
      spec: "9 gestur",
    },
    {
      title: "Tahan sampai terkunci",
      text: "Tahan gesturnya sekitar satu detik sampai bar di layar penuh. Hitungan mundur mulai sendiri.",
      spec: "Tahan ± 1 dtk",
    },
    {
      title: "3–2–1, cekrek",
      text:
        count > 1
          ? "Selama hitungan kamu bebas ganti pose. Habis cekrek, turunkan tangan sebentar untuk foto berikutnya."
          : "Selama hitungan kamu bebas ganti pose. Habis cekrek, langsung lanjut pilih desain.",
      spec: `${count} × 3 dtk`,
    },
  ];
}

export default async function TutorialPage({ searchParams }) {
  const { photos } = await searchParams;
  const count = parsePhotoCount(Array.isArray(photos) ? photos[0] : photos);
  const format = getFormat(count);
  const steps = buildSteps(count);

  return (
    <main className={`dtc-page ${styles.page}`}>
      <CustomCursor />

      <DtcHeader
        meta={
          <>
            <span>Tutorial</span>
            <span>Format {format.name}</span>
            <span>{count} foto</span>
          </>
        }
      >
        <Link className={styles.back} href="/#session" data-cursor="Back">
          <i className="dtc-arrow dtc-arrow--back" aria-hidden="true" />
          Ganti format
        </Link>
      </DtcHeader>

      <section className={styles.briefing} aria-labelledby="tutorial-title">
        <div className={`dtc-grid ${styles.intro}`}>
          <p className={`dtc-meta ${styles.label}`}>[ 04 ] / Tutorial</p>
          <h1 id="tutorial-title" className={styles.title}>
            <span className="dtc-reveal">
              <span>Before you</span>
            </span>
            <span className="dtc-reveal">
              <span className="dtc-accent" style={{ "--dtc-delay": "90ms" }}>
                pose.
              </span>
            </span>
          </h1>
          <div className={`dtc-fade-in ${styles.introAside}`}>
            <p className={styles.lead}>
              Kamera DTCBooth nggak punya tombol. Foto diambil begitu kamera
              membaca hand sign kamu, jadi cukup baca 4 langkah ini sekali.
            </p>
            <div className={styles.tags}>
              <span className="dtc-tag dtc-tag--solid">
                Format {pad2(count)} / {format.name}
              </span>
              <span className="dtc-tag">{count} foto</span>
              <span className="dtc-tag">± {estimateSeconds(count)} detik</span>
            </div>
          </div>
        </div>

        <ol className={`dtc-grid ${styles.steps}`}>
          {steps.map((step, index) => (
            <li
              key={step.title}
              className={`dtc-fade-in ${styles.step}`}
              style={{ "--dtc-delay": `${180 + index * 70}ms` }}
            >
              <span
                className={`dtc-outline ${styles.stepNumber}`}
                aria-hidden="true"
              >
                {pad2(index + 1)}
              </span>
              <h2 className={styles.stepTitle}>
                <span className="dtc-visually-hidden">
                  Step {pad2(index + 1)}:{" "}
                </span>
                {step.title}
              </h2>
              <p className={styles.stepText}>{step.text}</p>
              <span className={`dtc-tag dtc-tag--accent ${styles.stepSpec}`}>
                {step.spec}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section
        className={`dtc-grid ${styles.gestures}`}
        aria-labelledby="gestures-title"
      >
        <div className={styles.gestureHead}>
          <p className="dtc-meta">Hand signs / 09</p>
          <h2 id="gestures-title" className={styles.sectionTitle}>
            <span>Nine signs.</span>
            <span className="dtc-accent">Any one works.</span>
          </h2>
          <p className={styles.gestureIntro}>
            Tiap foto ada saran pose di layar, tapi semua gestur di sini tetap
            dihitung. Bentuk Love butuh dua tangan.
          </p>
        </div>

        <ul className={styles.gestureList}>
          {GESTURES.map((gesture, index) => (
            <li key={gesture.id} className={`dtc-on-scroll ${styles.gesture}`}>
              <span className={styles.gestureTop}>
                <span className={styles.gestureIndex}>{pad2(index + 1)}</span>
                {gesture.hands === 2 && (
                  <span className="dtc-tag dtc-tag--accent">2 tangan</span>
                )}
              </span>
              <HandGlyph pose={gesture.id} className={styles.gestureGlyph} />
              <strong className={styles.gestureName}>{gesture.label}</strong>
              <span className={styles.gestureNote}>{gesture.note}</span>
            </li>
          ))}
        </ul>
      </section>

      <section
        className={`dtc-surface-dark ${styles.distance}`}
        aria-labelledby="distance-title"
      >
        <div className={`dtc-grid ${styles.distanceHead}`}>
          <p className={`dtc-meta ${styles.label}`}>Ideal distance</p>
          <h2 id="distance-title" className={styles.distanceTitle}>
            1–2 <span className="dtc-accent">m</span>
          </h2>
          <p className={styles.distanceText}>
            Di jarak ini seluruh badan masuk frame, dan tangan masih cukup besar
            untuk dibaca AI. Rombongan boleh mundur, asal yang kasih hand sign
            tetap di depan.
          </p>
        </div>

        <div className={`dtc-grid ${styles.figure}`}>
          <DistanceDiagram />

          <dl className={styles.zones}>
            {ZONES.map((zone) => (
              <div
                key={zone.name}
                className={styles.zone}
                data-ideal={zone.ideal || undefined}
              >
                <dt>
                  <span className="dtc-meta">{zone.range}</span>
                  <strong>{zone.name}</strong>
                </dt>
                <dd>{zone.text}</dd>
              </div>
            ))}
          </dl>

          <ul className={styles.tips}>
            {TIPS.map((tip, index) => (
              <li key={tip.title} className={styles.tip}>
                <span className="dtc-meta">Tip {pad2(index + 1)}</span>
                <strong>{tip.title}</strong>
                <p>{tip.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <TutorialActions count={count} />
    </main>
  );
}
