/** @format */

import Image from "next/image";

import SiteHeader from "../components/brand/SiteHeader";
import HowItWorks from "../components/landing/HowItWorks";
import LiveStatus from "../components/landing/LiveStatus";
import SessionSetup from "../components/landing/SessionSetup";
import styles from "../components/landing/landing.module.css";
import { BRAND, LOGO } from "../data/brand";

export default function Home() {
  return (
    <main className={`cia-page ${styles.page}`}>
      <SiteHeader>
        <a className="cia-btn cia-btn--sm cia-btn--ghost" href="#how">
          Cara kerja
        </a>
      </SiteHeader>
      <div className="cia-hazard" />

      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.intro}>
          <Image
            src={LOGO.src}
            alt={LOGO.alt}
            width={LOGO.width}
            height={LOGO.height}
            className={styles.logo}
            sizes="(max-width: 860px) 160px, 220px"
            preload
          />
          <div className={styles.copy}>
            <p className="cia-label cia-kicker">Photobooth AI · {BRAND.field}</p>
            <h1 id="hero-title" className={`cia-display ${styles.title}`}>
              <span>Civil In</span> <span className="cia-red">Action</span>
            </h1>
            <p className={styles.lead}>
              Pilih jumlah foto, tunjukkan hand sign, dan kamera memotret sendiri.
              Photocard-nya dibawa pulang lewat QR.
            </p>
            <LiveStatus />
          </div>
        </div>

        <SessionSetup />
      </section>

      <HowItWorks />

      <footer className={styles.footer}>
        <span>
          {BRAND.short} · {BRAND.name}
        </span>
        <span>{BRAND.tagline}</span>
      </footer>
    </main>
  );
}
