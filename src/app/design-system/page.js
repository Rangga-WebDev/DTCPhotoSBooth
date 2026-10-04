/** @format */

import DtcLogo from "../../components/brand/DtcLogo";
import { DTC_COLORS, LOGO, LOGO_MARK, LOGO_WORDMARK } from "../../data/brand";
import SpecControls from "./SpecControls";
import styles from "./design-system.module.css";

export const metadata = {
  title: "Design System · DTCBooth",
  robots: { index: false, follow: false },
};

const SECTIONS = [
  ["01", "Identity", "identity"],
  ["02", "Color", "color"],
  ["03", "Type", "type"],
  ["04", "Grid", "grid"],
  ["05", "Components", "components"],
  ["06", "Motion", "motion"],
];

const FAMILIES = [
  {
    role: "Display",
    name: "Archivo Variable",
    style: {
      fontFamily: "var(--dtc-font-display)",
      fontStretch: "62%",
      fontWeight: 800,
    },
    axes: "wght 100–900 / wdth 62–125",
    use: "Headline poster, angka countdown, dan label extended yang meniru wordmark logo.",
  },
  {
    role: "Body",
    name: "Instrument Sans",
    style: { fontFamily: "var(--dtc-font-body)", fontWeight: 400 },
    axes: "400 / 600",
    use: "Paragraf, instruksi, dan teks tombol di halaman download HP.",
  },
  {
    role: "Tech / Meta",
    name: "IBM Plex Mono",
    style: { fontFamily: "var(--dtc-font-mono)", fontWeight: 500 },
    axes: "400 / 500 / 600",
    use: "Status kamera, nomor sesi, gestur, timer, dan koordinat.",
  },
];

const TYPE_SCALE = [
  {
    cls: "dtc-display",
    sample: "Booth",
    token: "--dtc-text-display",
    spec: "Archivo 800 · wdth 66 · 64–192 px",
  },
  {
    cls: "dtc-h1",
    sample: "Choose your frame.",
    token: "--dtc-text-h1",
    spec: "Archivo 800 · wdth 72 · 48–112 px",
  },
  {
    cls: "dtc-h2",
    sample: "04 steps. One memory.",
    token: "--dtc-text-h2",
    spec: "Archivo 750 · wdth 78 · 36–72 px",
  },
  {
    cls: "dtc-h3",
    sample: "Gesture bisa dipakai dari jauh",
    token: "--dtc-text-h3",
    spec: "Archivo 700 · wdth 88 · 24–36 px",
  },
  {
    cls: "dtc-lead",
    sample:
      "Berdiri di area kamera, angkat tangan, lalu biarkan hitungan mundur yang bekerja.",
    token: "--dtc-text-lead",
    spec: "Instrument Sans 400 · 18–22 px",
  },
  {
    cls: "dtc-meta",
    sample: "CAM / READY · SESSION 001",
    token: "--dtc-text-meta",
    spec: "IBM Plex Mono 500 · 12 px · +8%",
  },
];

const DURATIONS = [
  { token: "--dtc-dur-1", ms: 150, use: "Hover, tekan tombol, status" },
  { token: "--dtc-dur-2", ms: 240, use: "Perubahan state UI" },
  { token: "--dtc-dur-3", ms: 400, use: "Reveal teks & gambar" },
  { token: "--dtc-dur-4", ms: 600, use: "Transisi halaman, print photocard" },
];

const EASINGS = [
  { token: "--dtc-ease", points: [0.2, 0.7, 0.1, 1], use: "Default semua UI" },
  {
    token: "--dtc-ease-expo",
    points: [0.16, 1, 0.3, 1],
    use: "Reveal & wipe tombol",
  },
  {
    token: "--dtc-ease-inout",
    points: [0.65, 0, 0.35, 1],
    use: "Shutter & ganti halaman",
  },
];

function pct(value, total) {
  return `${(value / total) * 100}%`;
}

function boxStyle(box) {
  return {
    left: pct(box.x, LOGO.width),
    top: pct(box.y, LOGO.height),
    width: pct(box.w, LOGO.width),
    height: pct(box.h, LOGO.height),
  };
}

function SectionHead({ index, id, title, meta, note }) {
  return (
    <header className={`dtc-grid ${styles.sectionHead}`}>
      <span className={`dtc-outline ${styles.sectionIndex}`} aria-hidden="true">
        {index}
      </span>
      <h2 id={`${id}-title`} className={`dtc-h1 ${styles.sectionTitle}`}>
        {title}
      </h2>
      <div className={styles.sectionNote}>
        <p className="dtc-meta">{meta}</p>
        <p className="dtc-body">{note}</p>
      </div>
    </header>
  );
}

function SpecRow({ label, note, dark = false, children }) {
  return (
    <div
      className={`dtc-grid ${styles.specRow} ${dark ? "dtc-surface-dark" : ""}`}
    >
      <div className={styles.specLabel}>
        <h3 className="dtc-h3">{label}</h3>
        <p className={styles.specNote}>{note}</p>
      </div>
      <div className={styles.specDemo}>{children}</div>
    </div>
  );
}

function ButtonSample({
  primary = false,
  large = false,
  index,
  label,
  arrow = "",
}) {
  const classes = [
    "dtc-btn",
    primary && "dtc-btn--primary",
    large && "dtc-btn--lg",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <a className={classes} href="#components">
      {index && <span className="dtc-btn__index">{index}</span>}
      <span>{label}</span>
      <span className="dtc-btn__arrow">
        <i className={`dtc-arrow ${arrow}`} aria-hidden="true" />
      </span>
    </a>
  );
}

export default function DesignSystemPage() {
  return (
    <main className={`dtc-page ${styles.page}`}>
      <SpecControls />

      <header className={styles.bar}>
        <a
          className={styles.brand}
          href="#top"
          aria-label="DTCBooth, kembali ke atas"
        >
          <DtcLogo variant="mark" width={44} decorative />
          <span className="dtc-wide">DTCBooth</span>
        </a>
        <p className={`dtc-meta dtc-slashes ${styles.barMeta}`}>
          <span>Design system</span>
          <span>v1.0</span>
          <span>Tahap 01</span>
        </p>
        <span className={`dtc-status ${styles.barStatus}`} data-state="active">
          <i className="dtc-node" /> Doc / internal
        </span>
      </header>

      <section
        id="top"
        className={`dtc-grid ${styles.masthead}`}
        aria-labelledby="ds-title"
      >
        <div className={styles.mastMeta}>
          <span className="dtc-meta">Doc 001</span>
          <span className="dtc-meta">Digital engineering editorial</span>
          <span className="dtc-meta">DTC / 2026</span>
        </div>

        <h1 id="ds-title" className={`dtc-hero-type ${styles.mastTitle}`}>
          <span className="dtc-reveal">
            <span>Design</span>
          </span>
          <span className="dtc-reveal">
            <span className="dtc-accent" style={{ "--dtc-delay": "90ms" }}>
              System.
            </span>
          </span>
        </h1>

        <div className={styles.mastAside}>
          <p className="dtc-lead">
            Satu bahasa visual untuk semua layar DTCBooth, dari landing, kamera,
            sampai halaman download di HP.
          </p>
          <dl className={styles.specList}>
            <div>
              <dt className="dtc-meta">Palet</dt>
              <dd>9 warna brand + 1 grey untuk teks kecil</dd>
            </div>
            <div>
              <dt className="dtc-meta">Tipe</dt>
              <dd>Archivo · Instrument Sans · IBM Plex Mono</dd>
            </div>
            <div>
              <dt className="dtc-meta">Grid</dt>
              <dd>12 / 8 / 4 kolom</dd>
            </div>
            <div>
              <dt className="dtc-meta">Motion</dt>
              <dd>150–600 ms, transform & opacity</dd>
            </div>
          </dl>
        </div>

        <nav className={styles.toc} aria-label="Isi dokumen">
          {SECTIONS.map(([number, label, id]) => (
            <a key={id} href={`#${id}`}>
              <span className="dtc-meta">{number}</span>
              <span className={styles.tocLabel}>{label}</span>
              <i className="dtc-arrow dtc-arrow--down" aria-hidden="true" />
            </a>
          ))}
        </nav>
      </section>

      {/* 01 IDENTITY */}
      <section
        id="identity"
        className={styles.section}
        aria-labelledby="identity-title"
      >
        <SectionHead
          index="01"
          id="identity"
          title="Identity"
          meta={`logoDTC.jpeg / ${LOGO.width} × ${LOGO.height} / latar ${LOGO.background}`}
          note="Monogram DTC dengan jalur sirkuit di dalam hurufnya. Node bulat di ujung jalur dan wordmark yang lebar jadi sumber bahasa visual seluruh situs."
        />

        <div className={`dtc-grid ${styles.identity}`}>
          <figure className={styles.drawing}>
            <div className={styles.drawingFrame}>
              <div className={styles.drawingSheet}>
                <DtcLogo width="100%" sizes="(max-width: 1024px) 90vw, 760px" />
                <span
                  className={styles.markBox}
                  style={boxStyle(LOGO_MARK)}
                  aria-hidden="true"
                >
                  <span className="dtc-micro">
                    Mark · {LOGO_MARK.w} × {LOGO_MARK.h}
                  </span>
                </span>
                <span
                  className={styles.wordBox}
                  style={boxStyle(LOGO_WORDMARK)}
                  aria-hidden="true"
                >
                  <span className="dtc-micro">Wordmark · extended</span>
                </span>
                <span className={styles.dimTop} aria-hidden="true">
                  <span className="dtc-micro">{LOGO.width} px</span>
                </span>
                <span className={styles.dimSide} aria-hidden="true">
                  <span className="dtc-micro">{LOGO.height} px</span>
                </span>
              </div>
            </div>
            <figcaption className="dtc-meta">
              Fig. 01 / Anatomi logo. Kotak biru = monogram untuk favicon,
              header kecil, dan watermark.
            </figcaption>
          </figure>

          <div className={styles.variants}>
            <div className={styles.variant}>
              <div className={styles.variantStage}>
                <DtcLogo variant="mark" width={132} />
              </div>
              <p className="dtc-meta">A / Mark di paper</p>
            </div>
            <div className={`dtc-surface-dark ${styles.variant}`}>
              <div className={styles.variantStage}>
                <DtcLogo variant="mark" plate width={132} />
              </div>
              <p className="dtc-meta">B / Mark + pelat di navy</p>
            </div>
            <div className={styles.variant}>
              <div className={`${styles.variantStage} ${styles.variantPrint}`}>
                <div className="dtc-print">
                  <DtcLogo width={170} />
                </div>
              </div>
              <p className="dtc-meta">C / Logo penuh di lembar print</p>
            </div>
            <div className={styles.variant}>
              <div className={`${styles.variantStage} ${styles.favicons}`}>
                {[64, 32, 16].map((px) => (
                  // eslint-disable-next-line @next/next/no-img-element -- pratinjau ikon yang di-generate route /icon
                  <img
                    key={px}
                    src="/icon"
                    width={px}
                    height={px}
                    alt={px === 64 ? "Favicon DTCBooth" : ""}
                  />
                ))}
              </div>
              <p className="dtc-meta">D / Favicon 64 · 32 · 16</p>
            </div>
          </div>

          <ol className={styles.rules}>
            <li>
              <span className="dtc-meta">01 / Boleh</span>
              <p>
                Taruh di paper #F7F9FB. Latar JPEG #F7F7F7 menyatu tanpa
                kelihatan kotaknya.
              </p>
            </li>
            <li>
              <span className="dtc-meta">02 / Boleh</span>
              <p>
                Di permukaan gelap, selalu pakai pelat terang (varian B). Jangan
                taruh JPEG langsung di navy.
              </p>
            </li>
            <li>
              <span className="dtc-meta">03 / Ukuran</span>
              <p>
                Mark minimal 28 px tingginya. Logo penuh minimal 140 px lebarnya
                supaya wordmark terbaca.
              </p>
            </li>
            <li>
              <span className="dtc-meta">04 / Jangan</span>
              <p>
                Jangan di-stretch, diputar, diganti warna, diberi glow atau drop
                shadow, dan jangan crop wordmark-nya saja.
              </p>
            </li>
          </ol>
        </div>
      </section>

      {/* 02 COLOR */}
      <section
        id="color"
        className={`dtc-surface-dark ${styles.section}`}
        aria-labelledby="color-title"
      >
        <SectionHead
          index="02"
          id="color"
          title="Color"
          meta="Sampel piksel logo: #0060F0 · #00A8FC · #00C0FC"
          note="Biru adalah aksen, bukan latar tiap section. Section gelap dipakai seperlunya untuk ritme, sisanya paper."
        />

        <div className={styles.swatches}>
          {DTC_COLORS.map((color) => (
            <div
              key={color.token}
              className={styles.swatch}
              style={{
                "--sw": color.hex,
                "--sw-fg": color.fg,
                "--sw-span": color.span,
                "--sw-span-md": color.spanMd,
              }}
            >
              <span className="dtc-micro">{color.token}</span>
              <div>
                <strong className={styles.swatchName}>{color.name}</strong>
                <span className={styles.swatchHex}>{color.hex}</span>
                <span className={styles.swatchRole}>{color.role}</span>
                <span className="dtc-micro">{color.contrast}</span>
              </div>
            </div>
          ))}
        </div>

        <div className={`dtc-grid ${styles.distribution}`}>
          <p className="dtc-meta">Distribusi per layar</p>
          <div
            className={styles.distBar}
            role="img"
            aria-label="Paper 60 persen, navy dan ink 22 persen, biru 13 persen, cyan 5 persen"
          >
            <span style={{ "--w": "60%" }}>Paper 60</span>
            <span style={{ "--w": "22%" }}>Navy / Ink 22</span>
            <span style={{ "--w": "13%" }}>Blue 13</span>
            <span style={{ "--w": "5%" }}>Cyan 5</span>
          </div>
        </div>
      </section>

      {/* 03 TYPE */}
      <section
        id="type"
        className={styles.section}
        aria-labelledby="type-title"
      >
        <SectionHead
          index="03"
          id="type"
          title="Type"
          meta="2 family + 1 mono / lebar variabel 62–125"
          note="Satu family display dengan sumbu lebar: condensed untuk headline besar, extended untuk label yang meniru wordmark logo."
        />

        <div className={`dtc-grid ${styles.specimen}`}>
          <p className={styles.specimenType} aria-label="DTC Booth">
            <span className={styles.specimenWide}>DTC</span>
            <span className={`dtc-accent ${styles.specimenNarrow}`}>Booth</span>
          </p>
          <div className={styles.specimenNotes} aria-hidden="true">
            <span className="dtc-micro">wdth 125 · wght 900</span>
            <span className="dtc-micro">wdth 62 · wght 800</span>
          </div>
          <p className={`dtc-wide ${styles.specimenWordmark}`}>
            Discovery Technology Creative
          </p>
          <p className={`dtc-wide dtc-year ${styles.specimenYear}`}>2026</p>
        </div>

        <div className={`dtc-grid ${styles.families}`}>
          {FAMILIES.map((family) => (
            <article key={family.name} className={styles.family}>
              <span className="dtc-meta">{family.role}</span>
              <p
                className={styles.familyGlyph}
                style={family.style}
                aria-hidden="true"
              >
                Aa 26
              </p>
              <h3 className={styles.familyName}>{family.name}</h3>
              <p className="dtc-meta">{family.axes}</p>
              <p className={styles.familyUse}>{family.use}</p>
            </article>
          ))}
        </div>

        <div className={`dtc-grid ${styles.scale}`}>
          {TYPE_SCALE.map((row) => (
            <div key={row.token} className={styles.scaleRow}>
              <span className="dtc-meta">{row.token}</span>
              <p className={`${row.cls} ${styles.scaleSample}`}>{row.sample}</p>
              <span className="dtc-meta">{row.spec}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 04 GRID */}
      <section
        id="grid"
        className={styles.section}
        aria-labelledby="grid-title"
      >
        <SectionHead
          index="04"
          id="grid"
          title="Grid"
          meta="12 kolom ≥ 1024 / 8 kolom ≥ 640 / 4 kolom"
          note="Margin 16–72 px, gutter 12–28 px. Komposisi boleh asimetris dan saling tumpuk, tapi selalu kembali ke kolom. Tekan G untuk overlay."
        />

        <div className={`dtc-grid ${styles.columns}`} aria-hidden="true">
          {Array.from({ length: 12 }, (_, index) => (
            <span key={index} className="dtc-micro">
              {String(index + 1).padStart(2, "0")}
            </span>
          ))}
        </div>

        <div className={`dtc-grid ${styles.composition}`} aria-hidden="true">
          <div className={styles.compHead}>
            <span className="dtc-micro">Headline / kolom 1–7</span>
            <p className="dtc-display">Capture</p>
          </div>
          <div className={styles.compImage}>
            <span className="dtc-micro">
              Gambar / kolom 4–8, menumpuk headline
            </span>
          </div>
          <div className={styles.compMeta}>
            <span className="dtc-micro">Meta / kolom 9–12, turun</span>
            <p className="dtc-meta dtc-slashes">
              <span>AI photo experience</span>
              <span>Gesture controlled</span>
              <span>DTC 2026</span>
            </p>
          </div>
          <div className={styles.compNote}>
            <span className="dtc-micro">Catatan / kolom 10–12</span>
          </div>
        </div>
      </section>

      {/* 05 COMPONENTS */}
      <section
        id="components"
        className={styles.section}
        aria-labelledby="components-title"
      >
        <SectionHead
          index="05"
          id="components"
          title="Components"
          meta="Sudut 0 · garis 1–1.5 px · target sentuh ≥ 44 px"
          note="Bentuk teknis: label, garis, nomor, dan node dari jalur sirkuit logo. Tanpa kartu membulat, tanpa glow."
        />

        <div className={styles.specTable}>
          <SpecRow
            label="Button"
            note="Tinggi 56 px, 72 px untuk layar kiosk. Saat hover ada wipe gelap dan panah bergeser 4 px."
          >
            <ButtonSample primary large index="01" label="Mulai photobooth" />
            <ButtonSample label="Cara kerja" arrow="dtc-arrow--down" />
            <button className="dtc-btn" type="button" disabled>
              <span>Nonaktif</span>
              <span className="dtc-btn__arrow">
                <i className="dtc-arrow" aria-hidden="true" />
              </span>
            </button>
          </SpecRow>

          <SpecRow
            label="Button / dark"
            dark
            note="Di permukaan gelap, wipe berubah jadi paper supaya tetap kontras."
          >
            <ButtonSample primary index="02" label="Start camera" />
            <ButtonSample label="Download photo" arrow="dtc-arrow--down" />
          </SpecRow>

          <SpecRow
            label="Status"
            note="Node bulat meniru ujung jalur sirkuit di logo. Hanya status live yang berkedip."
          >
            <span className="dtc-status" data-state="active">
              <i className="dtc-node" /> Cam / ready
            </span>
            <span className="dtc-status" data-state="live">
              <i className="dtc-node" /> AI / active
            </span>
            <span className="dtc-status">
              <i className="dtc-node" /> Session / 001
            </span>
            <span className="dtc-status" data-state="error">
              <i className="dtc-node" /> Camera / error
            </span>
          </SpecRow>

          <SpecRow
            label="Label"
            note="Mono uppercase. Garis miring biru memisahkan metadata."
          >
            <span className="dtc-tag">AI photo experience</span>
            <span className="dtc-tag dtc-tag--accent">Gesture controlled</span>
            <span className="dtc-tag dtc-tag--solid">DTC 2026</span>
            <p className="dtc-meta dtc-slashes">
              <span>DTC</span>
              <span>2026</span>
              <span>Discovery technology creative</span>
            </p>
          </SpecRow>

          <SpecRow
            label="Trace & ruler"
            note="Penghubung antarlangkah dan skala ukur. Dipakai hemat, bukan pola latar."
          >
            <div className={styles.traceDemo}>
              <span className="dtc-meta">01</span>
              <span className="dtc-trace" />
              <span className="dtc-meta">02</span>
              <span className="dtc-trace dtc-trace--end" />
            </div>
            <div className={styles.rulerDemo}>
              <div className="dtc-ruler" />
              <div className={styles.rulerLabels}>
                <span className="dtc-micro">X 0000</span>
                <span className="dtc-micro">X 0960</span>
                <span className="dtc-micro">X 1920</span>
              </div>
            </div>
          </SpecRow>

          <SpecRow
            label="Frame guide"
            note="Penanda sudut tipis untuk kamera, bukan kotak wajah ala aplikasi KYC."
          >
            <div className={styles.cornersDemo}>
              <span
                className={`dtc-corners ${styles.cornersMarks}`}
                aria-hidden="true"
              />
              <p className="dtc-meta">Pastikan semua orang masuk ke frame</p>
              <span className="dtc-status" data-state="active">
                <i className="dtc-node" /> 4 people in frame
              </span>
            </div>
          </SpecRow>

          <SpecRow
            label="Print"
            note="Lembar photocard: kertas putih, satu bayangan tipis, boleh sedikit miring dan bertumpuk."
          >
            <div className={styles.printStack} aria-hidden="true">
              {["-5deg", "3deg"].map((tilt, index) => (
                <div
                  key={tilt}
                  className={`dtc-print ${styles.printSheet}`}
                  style={{ "--dtc-tilt": tilt }}
                >
                  <div className={styles.printHead}>
                    <span className="dtc-micro">DTC / 2026</span>
                    <span className="dtc-micro">0{index + 1}</span>
                  </div>
                  <span className={styles.printPhoto} />
                  <span className={styles.printPhoto} />
                  <div className={styles.printFoot}>
                    <DtcLogo variant="mark" width={30} decorative />
                    <span className="dtc-micro">DTCBooth</span>
                  </div>
                </div>
              ))}
            </div>
          </SpecRow>

          <SpecRow
            label="Index"
            note="Nomor outline untuk penanda section dan langkah tutorial."
          >
            <span className={`dtc-display dtc-outline ${styles.indexDemo}`}>
              04
            </span>
          </SpecRow>
        </div>
      </section>

      {/* 06 MOTION */}
      <section
        id="motion"
        className={`dtc-surface-ink ${styles.section}`}
        aria-labelledby="motion-title"
      >
        <SectionHead
          index="06"
          id="motion"
          title="Motion"
          meta="150–600 ms · hanya transform & opacity"
          note="Cepat, jelas, dan tidak mengganggu kamera. Halaman booth hanya memakai animasi status dan countdown."
        />

        <div className={`dtc-grid ${styles.durations}`} data-motion-demo>
          {DURATIONS.map((item) => (
            <div key={item.token} className={styles.durationRow}>
              <span className="dtc-meta">{item.token}</span>
              <span className={styles.durationTrack}>
                <span
                  className="dtc-draw"
                  style={{
                    animationDuration: `${item.ms}ms`,
                    width: `${(item.ms / 600) * 100}%`,
                  }}
                />
              </span>
              <strong className={`dtc-tabular ${styles.durationMs}`}>
                {item.ms} ms
              </strong>
              <span className={styles.durationUse}>{item.use}</span>
            </div>
          ))}
        </div>

        <div className={`dtc-grid ${styles.easings}`}>
          {EASINGS.map(({ token, points, use }) => {
            const [x1, y1, x2, y2] = points;
            return (
              <div key={token} className={styles.easing}>
                <svg viewBox="0 0 100 100" aria-hidden="true">
                  <path d="M0 100 L100 0" className={styles.easingBase} />
                  <path
                    d={`M0 100 C${x1 * 100} ${100 - y1 * 100} ${x2 * 100} ${100 - y2 * 100} 100 0`}
                  />
                </svg>
                <div>
                  <p className="dtc-meta">{token}</p>
                  <p className={styles.easingCurve}>
                    cubic-bezier({points.join(", ")})
                  </p>
                  <p className={styles.durationUse}>{use}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className={`dtc-grid ${styles.demos}`}>
          <div className={styles.demo} data-motion-demo>
            <span className="dtc-meta">A / Text reveal</span>
            <p className={`dtc-h2 ${styles.demoStage}`}>
              <span className="dtc-reveal">
                <span>Capture</span>
              </span>
              <span className="dtc-reveal">
                <span className="dtc-accent" style={{ "--dtc-delay": "80ms" }}>
                  Moment
                </span>
              </span>
            </p>
          </div>
          <div className={styles.demo} data-motion-demo>
            <span className="dtc-meta">B / Mask reveal</span>
            <div className={`dtc-mask-in ${styles.demoMask}`}>
              <span className="dtc-micro">Photo 01</span>
            </div>
          </div>
          <div className={styles.demo} data-motion-demo>
            <span className="dtc-meta">C / Line draw</span>
            <div className={styles.demoLines}>
              <span className="dtc-draw" />
              <span className="dtc-draw" style={{ "--dtc-delay": "120ms" }} />
              <span className="dtc-draw" style={{ "--dtc-delay": "240ms" }} />
            </div>
          </div>
          <div className={styles.demo} data-motion-demo>
            <span className="dtc-meta">D / Shutter</span>
            <div className={styles.demoShutter}>
              <span className="dtc-meta">Cekrek</span>
              <i className="dtc-shutter-blade" aria-hidden="true" />
            </div>
          </div>
        </div>
      </section>

      <footer className={`dtc-grid ${styles.footer}`}>
        <DtcLogo variant="mark" width={56} decorative />
        <p className="dtc-meta dtc-slashes">
          <span>DTCBooth</span>
          <span>Design system v1.0</span>
          <span>Tahap 01 / 12</span>
        </p>
        <p className="dtc-meta">DTC 2026 · Discovery Technology Creative</p>
      </footer>
    </main>
  );
}
