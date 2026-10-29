/** @format */

import Link from "next/link";

import Icon from "../../components/brand/Icon";
import SiteHeader from "../../components/brand/SiteHeader";
import HandGlyph from "../../components/gestures/HandGlyph";
import TutorialActions from "../../components/tutorial/TutorialActions";
import styles from "../../components/tutorial/tutorial.module.css";
import { estimateSeconds, getFormat, parsePhotoCount } from "../../data/formats";
import { GESTURES } from "../../data/gestures";

export const metadata = {
  title: "Tutorial · CIA Photobooth",
};

const TIPS = [
  {
    title: "Cukup satu yang kasih kode",
    text: "AI membaca 2 tangan sekaligus. Yang lain bebas pose, cukup satu orang yang kasih hand sign.",
  },
  { title: "Cahaya dari depan", text: "Jangan membelakangi lampu atau jendela yang terang." },
  { title: "Wajah tetap terlihat", text: "Angkat tangan di samping badan, jangan menutupi muka." },
];

function buildSteps(count) {
  return [
    { title: "Masuk ke frame", text: "Berdiri 1–2 meter dari kamera sampai semua wajah terlihat." },
    {
      title: "Tunjukkan hand sign",
      text: "Angkat tangan setinggi dada atau bahu, telapak menghadap kamera.",
    },
    { title: "Tahan sebentar", text: "Tahan diam ± 1 detik sampai bar penuh. Hitungan mundur mulai sendiri." },
    {
      title: "3 · 2 · 1, cekrek",
      text:
        count > 1
          ? "Bebas ganti pose saat hitungan. Setelah cekrek, turunkan tangan untuk foto berikutnya."
          : "Bebas ganti pose saat hitungan. Setelah cekrek, lanjut pilih desain.",
    },
  ];
}

export default async function TutorialPage({ searchParams }) {
  const { photos } = await searchParams;
  const count = parsePhotoCount(Array.isArray(photos) ? photos[0] : photos);
  const format = getFormat(count);

  return (
    <main className={`cia-page ${styles.page}`}>
      <SiteHeader
        meta={
          <span className="cia-label">
            Tutorial · {count} foto · {format.name}
          </span>
        }
      >
        <Link className="cia-btn cia-btn--sm cia-btn--ghost" href="/#session">
          <Icon name="back" />
          Ganti jumlah foto
        </Link>
      </SiteHeader>
      <div className="cia-hazard" />

      <section className={styles.intro} aria-labelledby="tutorial-title">
        <p className="cia-label cia-kicker">
          {count} foto · ± {estimateSeconds(count)} detik
        </p>
        <h1 id="tutorial-title" className={`cia-display ${styles.title}`}>
          Sebelum <span className="cia-red">pose.</span>
        </h1>
        <p className={styles.lead}>
          Kamera tidak punya tombol. Foto diambil begitu AI membaca hand sign kamu, jadi cukup
          ikuti 4 langkah ini.
        </p>
      </section>

      <ol className={styles.steps}>
        {buildSteps(count).map((step, index) => (
          <li key={step.title} className={styles.step}>
            <span className={styles.stepNumber}>0{index + 1}</span>
            <h2 className={styles.stepTitle}>{step.title}</h2>
            <p className={styles.stepText}>{step.text}</p>
          </li>
        ))}
      </ol>

      <section className={styles.gestures} aria-labelledby="gestures-title">
        <div className={styles.sectionHead}>
          <h2 id="gestures-title" className="cia-heading">
            9 hand sign, semuanya bisa
          </h2>
          <p className={styles.sectionNote}>
            Tiap foto ada saran pose di layar, tapi gestur mana pun di bawah ini tetap dihitung.
          </p>
        </div>
        <ul className={styles.gestureList}>
          {GESTURES.map((gesture) => (
            <li key={gesture.id} className={styles.gesture}>
              <HandGlyph pose={gesture.id} className={styles.gestureGlyph} />
              <strong>{gesture.label}</strong>
              <span>{gesture.note}</span>
              {gesture.hands === 2 && <span className="cia-tag cia-tag--red">2 tangan</span>}
            </li>
          ))}
        </ul>
      </section>

      <ul className={styles.tips}>
        {TIPS.map((tip) => (
          <li key={tip.title} className={styles.tip}>
            <strong>{tip.title}</strong>
            <p>{tip.text}</p>
          </li>
        ))}
      </ul>

      <TutorialActions count={count} />
    </main>
  );
}
