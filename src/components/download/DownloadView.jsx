/** @format */

import Image from "next/image";
import { cache } from "react";

import { CARD_SIZE } from "../../lib/photocard/layouts";
import { getSharedPhotoInfo, isValidPhotoId } from "../../lib/photoServer";
import DtcLogo from "../brand/DtcLogo";
import DownloadActions from "./DownloadActions";
import ExpiryCountdown from "./ExpiryCountdown";
import styles from "./download.module.css";

// Server component bersama untuk /d/[id] (QR baru) dan /download/[id] (link lama).
const getInfo = cache(getSharedPhotoInfo);

export async function downloadMetadata(id) {
  const info = await getInfo(id);
  return {
    title:
      info.status === "ready"
        ? "Your photocard · DTCBooth"
        : "This memory has expired · DTCBooth",
    description: "Photocard kamu dari DTCBooth, DTC 2026.",
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
  const time = date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
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
        <DtcLogo variant="mark" width={34} plate={!ready} decorative />
        <span className="dtc-wide">DTCBooth</span>
      </span>
      <span className="dtc-status" data-state={ready ? "active" : "error"}>
        <i className="dtc-node" />
        {ready ? "Siap disimpan" : "Link tidak aktif"}
      </span>
    </header>
  );
}

function Footer() {
  return (
    <footer className={styles.footer}>
      <span>DTC 2026 · Discovery Technology Creative</span>
      <span>Dibuat di DTCBooth</span>
    </footer>
  );
}

function Expired({ info, shortId }) {
  const expired = info.status === "expired";

  return (
    <main className={`dtc-page dtc-surface-ink ${styles.page}`}>
      <Header ready={false} />
      <section className={styles.expired} aria-labelledby="expired-title">
        <div className={styles.void} aria-hidden="true">
          <span>{shortId}</span>
          <span>File unavailable</span>
        </div>
        <p className="dtc-meta">Status / {expired ? "Expired" : "Not found"}</p>
        <h1 id="expired-title" className={styles.expiredTitle}>
          This memory has <span className="dtc-accent">expired.</span>
        </h1>
        <p className={styles.lead}>
          {expired
            ? `Photocard ini cuma bisa dibuka selama 24 jam, dan masa aktifnya sudah berakhir ${formatDate(info.expiresAt)}.`
            : "Link ini sudah tidak aktif, atau alamatnya tidak lengkap. Kalau QR-nya masih ada di layar booth, coba scan ulang."}
        </p>
        <p className={styles.lead}>
          Masih di lokasi DTC 2026? Mampir lagi ke booth, fotonya bisa diulang.
        </p>
      </section>
      <Footer />
    </main>
  );
}

export default async function DownloadView({ id }) {
  const info = await getInfo(id);
  const shortId = isValidPhotoId(id) ? id.slice(0, 8).toUpperCase() : "—";

  if (info.status !== "ready") {
    return <Expired info={info} shortId={shortId} />;
  }

  const imageUrl = `/api/photos/${encodeURIComponent(id)}`;
  const size = info.size ?? CARD_SIZE;
  const is4R =
    size.width === CARD_SIZE.width && size.height === CARD_SIZE.height;
  const until = formatDate(info.expiresAt);

  return (
    <main className={`dtc-page ${styles.page}`}>
      <Header ready />

      <section className={styles.hero} aria-labelledby="download-title">
        <p className="dtc-meta">[ DTC 2026 ] / Photocard {shortId}</p>
        <h1 id="download-title" className={styles.title}>
          Your <span className="dtc-accent">photocard.</span>
        </h1>
        <p className={styles.lead}>
          Simpan sekarang, ya. Link ini aktif sampai {until}.
        </p>
      </section>

      <div className={styles.layout}>
        <figure className={`dtc-surface-ink ${styles.tray}`}>
          <div className={styles.print}>
            <Image
              src={imageUrl}
              alt={`Photocard DTCBooth ${shortId}`}
              width={size.width}
              height={size.height}
              unoptimized
              loading="eager"
              fetchPriority="high"
              className={styles.image}
            />
          </div>
          <figcaption className={styles.caption}>
            <span>Photo ID {shortId}</span>
            <span>
              {info.size
                ? `${is4R ? `${CARD_SIZE.name} · ` : ""}${size.width} × ${size.height} px`
                : "JPG"}
            </span>
          </figcaption>
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
              <dd>JPG · {formatBytes(info.bytes)}</dd>
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
            Link ini pribadi. Siapa pun yang punya link bisa membuka photocard
            ini sampai {until}, jadi bagikan ke orang yang kamu percaya saja.
          </p>
        </div>
      </div>

      <Footer />
    </main>
  );
}
