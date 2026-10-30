/** @format */

import { COLORS, HMS, MARK, MARK_INK } from "../../data/brand";

export const FONT = {
  display: '"Barlow Condensed", "Arial Narrow", Arial, sans-serif',
  body: '"Barlow", "Segoe UI", Arial, sans-serif',
};

// Canvas tidak menunggu @font-face CSS; varian ini dimuat dulu sebelum menggambar.
const FACES = [
  '800 64px "Barlow Condensed"',
  '700 64px "Barlow Condensed"',
  '600 64px "Barlow Condensed"',
  '400 32px "Barlow"',
  '600 32px "Barlow"',
];

const DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

// Gambar raster untuk desain (logo HMS). Gagal dimuat → desain memakai gambar cadangan;
// percobaan ulang baru setelah jeda supaya render beruntun (thumbnail) tidak ikut menunggu.
const ART_SOURCES = { hms: HMS.logo.src };
const ART_TIMEOUT_MS = 8000;
const ART_RETRY_MS = 10_000;
const art = {};

let fontsReady = null;
let artReady = null;
let artRetryAt = 0;
let markPaths = null;

export function loadFonts() {
  if (typeof document === "undefined" || !document.fonts?.load) {
    return Promise.resolve();
  }
  fontsReady ??= Promise.race([
    Promise.allSettled(
      FACES.map((face) => document.fonts.load(face, "CIVIL IN ACTION 0123")),
    ),
    // Photocard tetap dibuat walau font lambat.
    new Promise((resolve) => setTimeout(resolve, 2500)),
  ]);
  return fontsReady;
}

async function loadArtwork(name, src) {
  if (art[name]) return true;
  try {
    const signal =
      typeof AbortSignal.timeout === "function" ? AbortSignal.timeout(ART_TIMEOUT_MS) : undefined;
    const response = await fetch(src, { signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    art[name] = await createImageBitmap(await response.blob());
    return true;
  } catch (error) {
    console.warn(`Gambar photocard "${name}" gagal dimuat:`, error);
    return false;
  }
}

export function loadArt() {
  if (typeof window === "undefined" || typeof createImageBitmap !== "function") {
    return Promise.resolve();
  }
  if (!artReady && Date.now() < artRetryAt) return Promise.resolve();
  artReady ??= Promise.all(
    Object.entries(ART_SOURCES).map(([name, src]) => loadArtwork(name, src)),
  ).then((loaded) => {
    if (!loaded.includes(false)) return;
    artReady = null;
    artRetryAt = Date.now() + ART_RETRY_MS;
  });
  return artReady;
}

function getMarkPaths() {
  markPaths ??= { red: new Path2D(MARK.red), ink: new Path2D(MARK.ink) };
  return markPaths;
}

// Blob (IndexedDB) atau URL → ImageBitmap; resizeWidth untuk pratinjau kecil.
export async function loadPhotos(sources, { resizeWidth } = {}) {
  return Promise.all(
    sources.map(async (source) => {
      const blob =
        source instanceof Blob ? source : await (await fetch(source)).blob();
      return createImageBitmap(
        blob,
        resizeWidth ? { resizeWidth, resizeQuality: "high" } : undefined,
      );
    }),
  );
}

export function getStamp(value, sessionNumber) {
  const parsed = new Date(value ?? Date.now());
  const date = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  const pad = (n) => String(n).padStart(2, "0");
  const month = MONTHS[date.getMonth()];
  const serial = `${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}`;

  return {
    longDate: `${DAYS[date.getDay()]}, ${date.getDate()} ${month} ${date.getFullYear()}`,
    shortDate: `${date.getDate()} ${month.slice(0, 3)} ${date.getFullYear()}`,
    numericDate: `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`,
    time: `${pad(date.getHours())}.${pad(date.getMinutes())}`,
    serial,
    session: sessionNumber
      ? String(sessionNumber).padStart(3, "0")
      : serial.slice(-4),
    seed: Math.floor(date.getTime() / 1000),
  };
}

function seeded(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function grainTile(strength, random) {
  const size = 160;
  const tile = document.createElement("canvas");
  tile.width = size;
  tile.height = size;
  const tileCtx = tile.getContext("2d");
  const pixels = tileCtx.createImageData(size, size);
  for (let i = 0; i < pixels.data.length; i += 4) {
    const value = random() < 0.5 ? 0 : 255;
    pixels.data[i] = value;
    pixels.data[i + 1] = value;
    pixels.data[i + 2] = value;
    pixels.data[i + 3] = random() * 255 * strength;
  }
  tileCtx.putImageData(pixels, 0, 0);
  return tile;
}

const NO_TONE = { css: "" };

// Semua primitif gambar yang dipakai desain. Ukuran dalam ruang kartu 1200 px.
// tone = filter foto (lihat filters.js); hanya diterapkan di kit.photo.
export function createKit(ctx, { width, height, stamp, tone = NO_TONE }) {
  const random = seeded(stamp.seed);
  // RNG terpisah: ganti filter tidak menggeser posisi ornamen acak desain.
  const toneRandom = seeded(stamp.seed + 7);
  let toneGrain = null;

  function setFont({ size = 32, weight = 700, family = "display" }) {
    ctx.font = `${weight} ${size}px ${FONT[family] ?? FONT.display}`;
  }

  const kit = {
    ctx,
    W: width,
    H: height,
    stamp,
    random,

    fill(color, x = 0, y = 0, w = width, h = height) {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, w, h);
    },

    line(x1, y1, x2, y2, color, lineWidth = 2, dash) {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      if (dash) ctx.setLineDash(dash);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.restore();
    },

    strokeRect(x, y, w, h, color, lineWidth = 2, dash) {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      if (dash) ctx.setLineDash(dash);
      ctx.strokeRect(x, y, w, h);
      ctx.restore();
    },

    circle(x, y, r, fill, stroke, lineWidth = 2) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      if (fill) {
        ctx.fillStyle = fill;
        ctx.fill();
      }
      if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
      }
    },

    roundRect(x, y, w, h, r, fill, stroke, lineWidth = 2) {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
      if (fill) {
        ctx.fillStyle = fill;
        ctx.fill();
      }
      if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
      }
    },

    polygon(points, fill, stroke, lineWidth = 2) {
      ctx.beginPath();
      points.forEach(([x, y], index) => {
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      if (fill) {
        ctx.fillStyle = fill;
        ctx.fill();
      }
      if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
      }
    },

    text(value, x, y, options = {}) {
      const {
        color = COLORS.black,
        align = "left",
        baseline = "alphabetic",
        spacing = 0,
      } = options;
      setFont(options);
      ctx.fillStyle = color;
      ctx.textAlign = align;
      ctx.textBaseline = baseline;
      ctx.letterSpacing = `${spacing}px`;
      // letterSpacing juga ditambahkan setelah huruf terakhir.
      const shift = align === "center" ? spacing / 2 : align === "right" ? spacing : 0;
      ctx.fillText(value, x + shift, y);
      ctx.letterSpacing = "0px";
    },

    measure(value, options = {}) {
      setFont(options);
      ctx.letterSpacing = `${options.spacing ?? 0}px`;
      const measured = ctx.measureText(value).width;
      ctx.letterSpacing = "0px";
      return measured;
    },

    outlineText(value, x, y, options = {}) {
      const { color = COLORS.black, align = "left", lineWidth = 2 } = options;
      setFont(options);
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineJoin = "round";
      ctx.textAlign = align;
      ctx.textBaseline = "alphabetic";
      ctx.strokeText(value, x, y);
    },

    // Huruf ala stensil cat proyek: teks dibelah garis setinggi ± 45% huruf.
    stencil(value, x, y, options = {}) {
      const { size = 120, cut, cutRatio = 0.42 } = options;
      kit.text(value, x, y, options);
      if (!cut) return;
      const textWidth = kit.measure(value, options);
      const left =
        options.align === "center"
          ? x - textWidth / 2
          : options.align === "right"
            ? x - textWidth
            : x;
      kit.fill(cut, left - 4, y - size * 0.7 * cutRatio - size * 0.025, textWidth + 8, size * 0.05);
    },

    // Ukuran font terbesar yang muat di maxWidth.
    fit(value, maxWidth, options = {}) {
      let size = options.size ?? 200;
      const min = options.min ?? 16;
      while (size > min && kit.measure(value, { ...options, size }) > maxWidth) {
        size -= Math.max(1, Math.round(size * 0.04));
      }
      return size;
    },

    // Transform slot (miring di sekitar titik pusat) untuk bingkai + foto.
    within(slot, draw) {
      ctx.save();
      if (slot.rotate) {
        ctx.translate(slot.pivot.x, slot.pivot.y);
        ctx.rotate((slot.rotate * Math.PI) / 180);
        ctx.translate(-slot.pivot.x, -slot.pivot.y);
      }
      draw();
      ctx.restore();
    },

    // bleed: gambar dilebihkan di tiap sisi (untuk blur, supaya tepinya tidak transparan).
    photo(image, slot, { radius = 0, filter = "", bleed = 0 } = {}) {
      const { x, y, w, h } = slot;
      const scale = Math.max((w + bleed * 2) / image.width, (h + bleed * 2) / image.height);
      const drawWidth = image.width * scale;
      const drawHeight = image.height * scale;

      kit.within(slot, () => {
        ctx.beginPath();
        if (radius) ctx.roundRect(x, y, w, h, radius);
        else ctx.rect(x, y, w, h);
        ctx.clip();
        ctx.filter = [tone.css, filter].filter(Boolean).join(" ") || "none";
        ctx.drawImage(
          image,
          x + (w - drawWidth) / 2,
          y + (h - drawHeight) / 2,
          drawWidth,
          drawHeight,
        );
        ctx.filter = "none";

        if (tone.tint) {
          ctx.globalCompositeOperation = tone.tint.mode;
          ctx.globalAlpha = tone.tint.alpha;
          ctx.fillStyle = tone.tint.color;
          ctx.fillRect(x, y, w, h);
          ctx.globalAlpha = 1;
        }
        if (tone.fade) {
          ctx.globalCompositeOperation = "lighten";
          ctx.fillStyle = tone.fade;
          ctx.fillRect(x, y, w, h);
        }
        ctx.globalCompositeOperation = "source-over";
        if (tone.grain) {
          toneGrain ??= ctx.createPattern(grainTile(tone.grain, toneRandom), "repeat");
          ctx.fillStyle = toneGrain;
          ctx.fillRect(x, y, w, h);
        }
      });
    },

    // Gambar raster yang sudah dimuat loadArt(); null kalau belum/gagal.
    art(name) {
      return art[name] ?? null;
    },

    image(source, x, y, w, h) {
      ctx.drawImage(source, x, y, w, h);
    },

    shadow(color, blur, offsetY, draw) {
      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur = blur;
      ctx.shadowOffsetY = offsetY;
      draw();
      ctx.restore();
    },

    grid(color, step, lineWidth = 1, area = [0, 0, width, height]) {
      const [x0, y0, w, h] = area;
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      for (let x = x0; x <= x0 + w; x += step) {
        ctx.moveTo(x, y0);
        ctx.lineTo(x, y0 + h);
      }
      for (let y = y0; y <= y0 + h; y += step) {
        ctx.moveTo(x0, y);
        ctx.lineTo(x0 + w, y);
      }
      ctx.stroke();
      ctx.restore();
    },

    // Pita pembatas proyek: garis diagonal dua warna di dalam kotak.
    hazard(x, y, w, h, colorA, colorB, band = 28, angle = -45) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, w, h);
      ctx.clip();
      ctx.fillStyle = colorB;
      ctx.fillRect(x, y, w, h);
      ctx.translate(x + w / 2, y + h / 2);
      ctx.rotate((angle * Math.PI) / 180);
      ctx.fillStyle = colorA;
      const reach = Math.hypot(w, h);
      for (let offset = -reach; offset < reach; offset += band * 2) {
        ctx.fillRect(offset, -reach, band, reach * 2);
      }
      ctx.restore();
    },

    grain(strength = 0.06) {
      ctx.save();
      ctx.fillStyle = ctx.createPattern(grainTile(strength, random), "repeat");
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    },

    barcode(x, y, w, h, color) {
      let cursor = x;
      ctx.fillStyle = color;
      while (cursor < x + w) {
        const bar = 2 + Math.floor(random() * 5);
        ctx.fillRect(cursor, y, Math.min(bar, x + w - cursor), h);
        cursor += bar + 2 + Math.floor(random() * 4);
      }
    },

    // Garis ukur gambar teknik: ujung bergaris miring + label di tengah (latar label = bg).
    dimension(x1, y, x2, label, { color = COLORS.black, bg, size = 20 } = {}) {
      kit.line(x1, y, x2, y, color, 2);
      [x1, x2].forEach((x) => {
        kit.line(x, y - 16, x, y + 16, color, 2);
        kit.line(x - 8, y + 8, x + 8, y - 8, color, 3);
      });
      if (!label) return;
      const options = { family: "display", size, weight: 700, spacing: size * 0.1, color };
      const labelWidth = kit.measure(label, options);
      if (bg) kit.fill(bg, (x1 + x2) / 2 - labelWidth / 2 - 14, y - size, labelWidth + 28, size * 2);
      kit.text(label, (x1 + x2) / 2, y + size * 0.35, { ...options, align: "center" });
    },

    // Logo CIA vektor. color = versi satu warna; tanpa color: C & A merah, i = ink.
    logo({ x, y, w, color, ink = MARK_INK.light, align = "left" }) {
      const scale = w / MARK.width;
      const left = align === "center" ? x - w / 2 : align === "right" ? x - w : x;
      const paths = getMarkPaths();
      ctx.save();
      ctx.translate(left, y);
      ctx.scale(scale, scale);
      ctx.fillStyle = color ?? COLORS.red;
      ctx.fill(paths.red);
      ctx.fillStyle = color ?? ink;
      ctx.fill(paths.ink);
      ctx.restore();
      return MARK.height * scale;
    },

    // Tanda kecil di tiap kartu: logo + "CIVIL IN ACTION · CIA PHOTOBOOTH".
    // plate = warna papan di belakang tanda (untuk latar ramai seperti dinding bata).
    watermark({
      x,
      y,
      color = COLORS.black,
      align = "left",
      mark = true,
      markColor,
      markInk,
      plate,
    }) {
      const label = "CIVIL IN ACTION · CIA PHOTOBOOTH";
      const options = { family: "display", size: 22, weight: 600, spacing: 3, color };
      const labelWidth = kit.measure(label, options);
      const markWidth = mark ? 30 : 0;
      const gap = mark ? 14 : 0;
      const total = markWidth + gap + labelWidth;
      const left = align === "center" ? x - total / 2 : align === "right" ? x - total : x;
      if (plate) kit.roundRect(left - 28, y - 41, total + 56, 60, 6, plate);
      if (mark) {
        kit.logo({ x: left, y: y - 28, w: markWidth, color: markColor, ink: markInk });
      }
      kit.text(label, left + markWidth + gap, y, options);
    },
  };

  return kit;
}
