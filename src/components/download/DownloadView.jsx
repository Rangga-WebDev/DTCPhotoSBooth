/** @format */

import Image from "next/image";
import { cache } from "react";

import { BRAND, LOGO } from "../../data/brand";
import { CARD_SIZE } from "../../lib/photocard/layouts";
import { getSharedPhotoInfo, isValidPhotoId } from "../../lib/photoServer";
import CiaMark from "../brand/CiaMark";
import DownloadActions from "./DownloadActions";
import ExpiryCountdown from "./ExpiryCountdown";
import styles from "./download.module.css";

// Server component bersama untuk /d/[id] (QR) dan /download/[id] (link lama).
const getInfo = cache(getSharedPhotoInfo);

export async function downloadMetadata(id) {
  const info = await getInfo(id);
  return {
    title:
      info.status === "ready"
        ? "Photocard kamu · CIA Photobooth"
        : "Link kedaluwarsa · CIA Photobooth",
    description: "Photocard kamu dari CIA Photobooth, Civil In Action.",
    robots: { index: false, follow: false },
    referrer: "no-referrer",
  };
}

function formatDate(value) {
  const date = new Date(value);
  const day = date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const time = date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  return `${day}, ${time}`;
}

function formatBytes(bytes) {
  return bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function Header({ ready }) {
  return (
    <header className={styles.header}>
      <span className={styles.brand}>
        <CiaMark width={30} />
        <span>{BRAND.product}</span>
      </span>
      <span className="cia-status" data-state={ready ? "ok" : "error"}>
        {ready ? "Siap disimpan" : "Link tidak aktif"}
      </span>
    </header>
  );
}

function Footer() {
  return (
    <footer className={styles.footer}>
      <span>
        {BRAND.short} · {BRAND.name}
      </span>
      <span>{BRAND.tagline}</span>
    </footer>
  );
}

function Expired({ info, shortId }) {
  const expired = info.status === "expired";

  return (
    <main className={`cia-page ${styles.page}`}>
      <Header ready={false} />
      <div className="cia-hazard" />
      <section className={styles.expired} aria-labelledby="expired-title">
        <p className="cia-label cia-kicker">
          {expired ? "Kedaluwarsa" : "Tidak ditemukan"} · {shortId}
        </p>
        <h1 id="expired-title" className={`cia-display ${styles.title}`}>
          Link sudah <span className="cia-red">tidak aktif.</span>
        </h1>
        <p className={styles.lead}>
          {expired
            ? `Photocard ini hanya bisa dibuka selama 24 jam, dan masa aktifnya berakhir ${formatDate(info.expiresAt)}.`
            : "Link ini sudah tidak aktif atau alamatnya tidak lengkap. Kalau QR-nya masih ada di layar booth, coba scan ulang."}
        </p>
        <p className={styles.lead}>Masih di lokasi Civil In Action? Mampir lagi ke booth, fotonya bisa diulang.</p>
      </section>
      <Footer />
    </main>
  );
}

export default async function DownloadView({ id }) {
  const info = await getInfo(id);
  const shortId = isValidPhotoId(id) ? id.slice(0, 8).toUpperCase() : "—";

  if (info.status !== "ready") return <Expired info={info} shortId={shortId} />;

  const imageUrl = `/api/photos/${encodeURIComponent(id)}`;
  const size = info.size ?? CARD_SIZE;
  const until = formatDate(info.expiresAt);

  return (
    <main className={`cia-page ${styles.page}`}>
      <Header ready />
      <div className="cia-hazard" />

      <section className={styles.hero} aria-labelledby="download-title">
        <Image
          src={LOGO.src}
          alt={LOGO.alt}
          width={LOGO.width}
          height={LOGO.height}
          className={styles.logo}
          sizes="88px"
          loading="eager"
        />
        <div>
          <p className="cia-label">Photocard {shortId}</p>
          <h1 id="download-title" className={`cia-display ${styles.title}`}>
            Photocard <span className="cia-red">kamu.</span>
          </h1>
          <p className={styles.lead}>Simpan sekarang, ya. Link aktif sampai {until}.</p>
        </div>
      </section>

      <div className={styles.layout}>
        <figure className={styles.tray}>
          <Image
            src={imageUrl}
            alt={`Photocard CIA Photobooth ${shortId}`}
            width={size.width}
            height={size.height}
            unoptimized
            loading="eager"
            fetchPriority="high"
            className={styles.image}
          />
        </figure>

        <DownloadActions
          imageUrl={imageUrl}
          downloadUrl={`${imageUrl}?download=1`}
          filename={info.filename}
          expiresAt={info.expiresAt}
        />

        <div className={styles.side}>
          <dl className={styles.specs}>
            <div>
              <dt>Photo ID</dt>
              <dd>{shortId}</dd>
            </div>
            <div>
              <dt>File</dt>
              <dd>
                JPG · {formatBytes(info.bytes)}
                {info.size ? ` · ${info.size.width} × ${info.size.height} px` : ""}
              </dd>
            </div>
            <div>
              <dt>Dibuat</dt>
              <dd>{formatDate(info.createdAt)}</dd>
            </div>
            <div>
              <dt>Sisa waktu</dt>
              <dd>
                <ExpiryCountdown expiresAt={info.expiresAt} />
              </dd>
            </div>
          </dl>
          <p className={styles.privacy}>
            Link ini pribadi. Siapa pun yang punya link bisa membuka photocard ini sampai {until},
            jadi bagikan ke orang yang kamu percaya saja.
          </p>
        </div>
      </div>

      <Footer />
    </main>
  );
}
