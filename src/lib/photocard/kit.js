/** @format */

import { LOGO, LOGO_MARK } from "../../data/brand";

export const FONT = {
  display: '"Archivo Variable", "Arial Narrow", Arial, sans-serif',
  body: '"Instrument Sans", "Segoe UI", Arial, sans-serif',
  mono: '"IBM Plex Mono", Consolas, monospace',
};

// Canvas tidak menunggu @font-face CSS; varian ini dimuat dulu sebelum menggambar.
const FACES = [
  '800 extra-condensed 64px "Archivo Variable"',
  '900 expanded 64px "Archivo Variable"',
  '700 64px "Archivo Variable"',
  '400 32px "Instrument Sans"',
  '600 32px "Instrument Sans"',
  '500 32px "IBM Plex Mono"',
  '600 32px "IBM Plex Mono"',
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

let fontsReady = null;
let logoReady = null;

export function loadFonts() {
  if (typeof document === "undefined" || !document.fonts?.load) {
    return Promise.resolve();
  }
  fontsReady ??= Promise.race([
    Promise.allSettled(
      FACES.map((face) => document.fonts.load(face, "DTC 2026 Booth 0123")),
    ),
    // Photocard tetap dibuat walau font lambat.
    new Promise((resolve) => setTimeout(resolve, 2500)),
  ]);
  return fontsReady;
}

function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Salah satu foto gagal dibuka."));
    image.src = src;
  });
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

// Latar JPEG logo (#F7F7F7) dibuang supaya logo bisa ditaruh di warna apa pun.
function keyOutBackground(image, crop) {
  const canvas = document.createElement("canvas");
  canvas.width = crop.w;
  canvas.height = crop.h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(image, crop.x, crop.y, crop.w, crop.h, 0, 0, crop.w, crop.h);

  const pixels = ctx.getImageData(0, 0, crop.w, crop.h);
  const data = pixels.data;
  for (let i = 0; i < data.length; i += 4) {
    const distance = 247 - Math.min(data[i], data[i + 1], data[i + 2]);
    const alpha = Math.max(0, Math.min(1, distance / 60));
    if (alpha <= 0) {
      data[i + 3] = 0;
      continue;
    }
    for (let c = 0; c < 3; c++) {
      data[i + c] = Math.max(
        0,
        Math.min(255, (data[i + c] - 247 * (1 - alpha)) / alpha),
      );
    }
    data[i + 3] = Math.round(alpha * 255);
  }
  ctx.putImageData(pixels, 0, 0);
  return canvas;
}

export function loadLogo() {
  logoReady ??= loadImageElement(LOGO.src).then((image) => ({
    full: keyOutBackground(image, {
      x: 0,
      y: 0,
      w: LOGO.width,
      h: LOGO.height,
    }),
    mark: keyOutBackground(image, LOGO_MARK),
  }));
  return logoReady;
}

function tint(source, color) {
  const canvas = document.createElement("canvas");
  canvas.width = source.width;
  canvas.height = source.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(source, 0, 0);
  ctx.globalCompositeOperation = "source-in";
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  return canvas;
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
export function createKit(ctx, { width, height, stamp, logo, tone = NO_TONE }) {
  const random = seeded(stamp.seed);
  // RNG terpisah: ganti filter tidak menggeser posisi ornamen acak desain.
  const toneRandom = seeded(stamp.seed + 7);
  const tinted = new Map();
  let toneGrain = null;

  function setFont({
    size = 32,
    weight = 700,
    family = "display",
    stretch = "normal",
  }) {
    ctx.font = `${weight} ${size}px ${FONT[family]}`;
    if ("fontStretch" in ctx) ctx.fontStretch = stretch;
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

    text(value, x, y, options = {}) {
      const {
        color = "#050A12",
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
      const shift =
        align === "center" ? spacing / 2 : align === "right" ? spacing : 0;
      ctx.fillText(value, x + shift, y);
      ctx.letterSpacing = "0px";
    },

    measure(value, options = {}) {
      setFont(options);
      ctx.letterSpacing = `${options.spacing ?? 0}px`;
      const widthValue = ctx.measureText(value).width;
      ctx.letterSpacing = "0px";
      return widthValue;
    },

    outlineText(value, x, y, options = {}) {
      const { color = "#050A12", align = "left", lineWidth = 2 } = options;
      setFont(options);
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.textAlign = align;
      ctx.textBaseline = "alphabetic";
      ctx.strokeText(value, x, y);
    },

    // Ukuran font terbesar yang muat di maxWidth.
    fit(value, maxWidth, options = {}) {
      let size = options.size ?? 200;
      const min = options.min ?? 16;
      while (
        size > min &&
        kit.measure(value, { ...options, size }) > maxWidth
      ) {
        size -= Math.max(1, Math.round(size * 0.04));
      }
      return size;
    },

    wrap(value, maxWidth, options = {}) {
      const lines = [];
      let current = "";
      value.split(" ").forEach((word) => {
        const next = current ? `${current} ${word}` : word;
        if (current && kit.measure(next, options) > maxWidth) {
          lines.push(current);
          current = word;
        } else {
          current = next;
        }
      });
      if (current) lines.push(current);
      return lines;
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
      const scale = Math.max(
        (w + bleed * 2) / image.width,
        (h + bleed * 2) / image.height,
      );
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
          toneGrain ??= ctx.createPattern(
            grainTile(tone.grain, toneRandom),
            "repeat",
          );
          ctx.fillStyle = toneGrain;
          ctx.fillRect(x, y, w, h);
        }
      });
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

    dots(color, step, radius, area = [0, 0, width, height]) {
      const [x0, y0, w, h] = area;
      ctx.fillStyle = color;
      for (let y = y0 + step / 2; y < y0 + h; y += step) {
        for (let x = x0 + step / 2; x < x0 + w; x += step) {
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    },

    stripes(color, bandWidth, gap, angle = -45) {
      ctx.save();
      ctx.fillStyle = color;
      ctx.translate(width / 2, height / 2);
      ctx.rotate((angle * Math.PI) / 180);
      const reach = Math.hypot(width, height);
      for (let x = -reach; x < reach; x += bandWidth + gap) {
        ctx.fillRect(x, -reach, bandWidth, reach * 2);
      }
      ctx.restore();
    },

    grain(strength = 0.06) {
      ctx.save();
      ctx.fillStyle = ctx.createPattern(grainTile(strength, random), "repeat");
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    },

    star(x, y, radius, fill, points = 5, inner = 0.45) {
      ctx.beginPath();
      for (let i = 0; i < points * 2; i++) {
        const r = i % 2 ? radius * inner : radius;
        const a = (Math.PI / points) * i - Math.PI / 2;
        ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
    },

    sparkle(x, y, radius, fill) {
      kit.star(x, y, radius, fill, 4, 0.22);
    },

    heart(x, y, size, fill) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(size / 32, size / 32);
      ctx.beginPath();
      ctx.moveTo(0, 10);
      ctx.bezierCurveTo(-26, -8, -12, -30, 0, -14);
      ctx.bezierCurveTo(12, -30, 26, -8, 0, 10);
      ctx.fillStyle = fill;
      ctx.fill();
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

    // Logo DTC (latar sudah transparan); color = versi satu warna untuk latar gelap/berwarna.
    logo({ x, y, w, variant = "mark", color, align = "left" }) {
      if (!logo) return 0;
      const source = logo[variant];
      let image = source;
      if (color) {
        const key = `${variant}:${color}`;
        if (!tinted.has(key)) tinted.set(key, tint(source, color));
        image = tinted.get(key);
      }
      const h = (w * source.height) / source.width;
      const left =
        align === "center" ? x - w / 2 : align === "right" ? x - w : x;
      ctx.drawImage(image, left, y, w, h);
      return h;
    },

    // Watermark wajib di tiap kartu: monogram + "DTC 2026 · DTCBooth".
    watermark({
      x,
      y,
      color = "#050A12",
      align = "left",
      mark = true,
      logoColor,
    }) {
      const label = "DTC 2026 · DTCBooth";
      const opts = {
        size: 20,
        weight: 500,
        family: "mono",
        spacing: 2.4,
        color,
      };
      const labelWidth = kit.measure(label, opts);
      const markWidth = mark ? 44 : 0;
      const gap = mark ? 14 : 0;
      const total = markWidth + gap + labelWidth;
      const left =
        align === "center" ? x - total / 2 : align === "right" ? x - total : x;
      if (mark) {
        kit.logo({ x: left, y: y - 26, w: markWidth, color: logoColor });
      }
      kit.text(label, left + markWidth + gap, y, opts);
    },
  };

  return kit;
}
