/** @format */

import { getTheme, NEWS_CAPTIONS, POP_STICKERS } from "../data/themes";

function pad(value) {
  return String(value).padStart(2, "0");
}

// Versi mini photocard; susunannya mengikuti src/lib/photoComposer.js.
export default function PhotoLayoutPreview({
  photoCount = 3,
  themeId = "ticket",
}) {
  const theme = getTheme(themeId);
  const count = Math.min(6, Math.max(1, Number(photoCount) || 3));
  const cells = Array.from({ length: count }, (_, index) => index);

  return (
    <div className={`poster poster-${theme.id}`} aria-hidden="true">
      {theme.id === "ticket" && (
        <>
          <div className="pv-row pv-ticket-top">
            <span>TIKET MASUK</span>
            <span>NO. 0026</span>
          </div>
          <strong className="pv-title">TEKNIK FEST</strong>
          <div className="pv-ticket-info">
            <span>
              <small>TANGGAL</small>HARI INI
            </span>
            <span>
              <small>JAM</small>SEKARANG
            </span>
            <span>
              <small>ISI</small>
              {count} FOTO
            </span>
          </div>
        </>
      )}

      {theme.id === "retro" && (
        <>
          <div className="pv-row pv-news-top">
            <span>EDISI KHUSUS</span>
            <span>HARGA Rp0,-</span>
          </div>
          <strong className="pv-title">Harian Teknik Fest</strong>
          <div className="pv-row pv-news-date">
            <span>HARI INI</span>
            <span>{count} FOTO</span>
          </div>
          <b className="pv-headline">TERTANGKAP KAMERA!</b>
          <p className="pv-deck">
            Redaksi berhasil mengamankan {count} foto sebagai barang bukti.
          </p>
        </>
      )}

      {theme.id === "pop" && (
        <>
          <span className="pv-pop-caption">SEMENTARA ITU, DI TEKNIK FEST…</span>
          <span className="pv-pop-burst">
            <span>JEPRET!</span>
          </span>
          <strong className="pv-title">TEKNIK FEST</strong>
          <span className="pv-pop-strip">EDISI POP · {count} PANEL</span>
        </>
      )}

      {theme.id === "cyber" && (
        <>
          <div className="pv-row pv-neon-hud">
            <span>
              <i /> REC
            </span>
            <span>CAM 01</span>
          </div>
          <strong className="pv-title">TEKNIK FEST</strong>
          <span className="pv-neon-sub">EDISI NEON MALAM · {count} FOTO</span>
        </>
      )}

      <div className={`poster-photo-grid grid-${count}`}>
        {cells.map((index) => (
          <div className="poster-cell" key={index}>
            <div className="poster-photo">
              {theme.id === "ticket" && (
                <span className="poster-tag">{pad(index + 1)}</span>
              )}
              {theme.id === "cyber" && (
                <span className="poster-hud">
                  <i /> REC
                </span>
              )}
            </div>
            {theme.id === "pop" && (
              <span className="poster-sticker">{POP_STICKERS[index]}</span>
            )}
            {theme.id === "retro" && (
              <span className="poster-caption">
                <b>FOTO {index + 1}.</b> {NEWS_CAPTIONS[index]}
              </span>
            )}
          </div>
        ))}
      </div>

      {theme.id === "ticket" && (
        <>
          <div className="pv-ticket-perf" />
          <div className="pv-ticket-stub">
            <i className="pv-barcode" />
            <span className="pv-stamp">
              SUDAH
              <br />
              DIFOTO
            </span>
          </div>
        </>
      )}

      {theme.id === "retro" && (
        <div className="pv-row pv-news-foot">
          <span>DICETAK DI PHOTOBOOTH TEKNIK FEST</span>
          <span>HAL. 1</span>
        </div>
      )}

      {theme.id === "pop" && (
        <div className="pv-pop-foot">
          <span className="pv-pop-next">BERSAMBUNG…</span>
          TEKNIK FEST 2026
        </div>
      )}

      {theme.id === "cyber" && (
        <div className="pv-neon-foot">
          <i className="pv-neon-sun" />
          <i className="pv-neon-grid" />
          <span>DIREKAM DI PHOTOBOOTH TEKNIK FEST</span>
        </div>
      )}
    </div>
  );
}
