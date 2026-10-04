/** @format */

import DtcHeader from "../components/brand/DtcHeader";
import DtcLogo from "../components/brand/DtcLogo";
import HowItWorks from "../components/landing/HowItWorks";
import LiveStatus from "../components/landing/LiveStatus";
import PrintStack from "../components/landing/PrintStack";
import SessionSetup from "../components/landing/SessionSetup";
import styles from "../components/landing/landing.module.css";
import CustomCursor from "../components/motion/CustomCursor";
import Magnetic from "../components/motion/Magnetic";

export default function Home() {
  return (
    <main className={`dtc-page ${styles.page}`} id="top">
      <a className={styles.skip} href="#session">
        Langsung pilih format foto
      </a>
      <CustomCursor />

      <DtcHeader
        meta={
          <>
            <span>DTC 2026</span>
            <span>Discovery Technology Creative</span>
          </>
        }
      >
        <a className={`dtc-meta ${styles.headerLink}`} href="#how">
          Cara kerja
        </a>
        <a className="dtc-btn dtc-btn--sm" href="#session" data-cursor="Mulai">
          <span>Mulai</span>
          <span className="dtc-btn__arrow">
            <i className="dtc-arrow dtc-arrow--down" aria-hidden="true" />
          </span>
        </a>
      </DtcHeader>

      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroMain}>
          <h1 id="hero-title" className={styles.heroTitle}>
            <span className="dtc-reveal">
              <span className={styles.titleDtc}>DTC</span>
            </span>
            <span className="dtc-reveal">
              <span
                className={styles.titleBooth}
                style={{ "--dtc-delay": "110ms" }}
              >
                Booth
              </span>
            </span>
          </h1>
          <p className={`dtc-wide dtc-fade-in ${styles.heroKicker}`}>
            Capture your moment.
          </p>
        </div>

        <div className={`dtc-fade-in ${styles.heroCopy}`}>
          <p className={styles.heroLead}>
            Photobooth AI resmi DTC 2026. Berdiri di depan kamera, kasih hand
            sign, dan kamera motret sendiri. Fotonya langsung dibawa pulang
            lewat QR.
          </p>
          <div className={styles.heroTags}>
            <span className="dtc-tag">AI photo experience</span>
            <span className="dtc-tag dtc-tag--accent">Gesture controlled</span>
          </div>
        </div>

        <div className={`dtc-fade-in ${styles.heroActions}`}>
          <Magnetic>
            <a
              className="dtc-btn dtc-btn--primary dtc-btn--lg"
              href="#session"
              data-cursor="Mulai"
            >
              <span className="dtc-btn__index">01</span>
              <span>Mulai photobooth</span>
              <span className="dtc-btn__arrow">
                <i className="dtc-arrow dtc-arrow--down" aria-hidden="true" />
              </span>
            </a>
          </Magnetic>
          <a className={`dtc-link ${styles.heroSecondary}`} href="#how">
            Lihat cara kerja
          </a>
        </div>

        <PrintStack />
        <p className={`dtc-meta dtc-fade-in ${styles.printsCaption}`}>
          Fig. 01 / Contoh photocard DTCBooth
        </p>

        <LiveStatus />

        <a
          className={styles.scrollCue}
          href="#how"
          aria-label="Scroll ke cara kerja"
        >
          <span className="dtc-micro">Scroll</span>
          <i />
        </a>
      </section>

      <HowItWorks />
      <SessionSetup />

      <footer className={`dtc-grid ${styles.footer}`}>
        <div className={styles.footerLogo}>
          <DtcLogo plate width="100%" sizes="(max-width: 640px) 60vw, 320px" />
        </div>
        <p className={`dtc-h2 ${styles.footerLine}`}>
          See you <span className="dtc-accent">in frame.</span>
        </p>
        <nav className={styles.footerNav} aria-label="Navigasi bawah">
          <a href="#how">Cara kerja</a>
          <a href="#session">Mulai sesi</a>
          <a href="#top">Ke atas</a>
        </nav>
        <div className={styles.footerMeta}>
          <span className="dtc-meta">DTCBooth · AI photobooth</span>
          <span className="dtc-meta">
            DTC 2026 · Discovery Technology Creative
          </span>
        </div>
      </footer>
    </main>
  );
}
