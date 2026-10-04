/**
 * Menyusun foto satu sesi menjadi satu photocard JPEG.
 *
 * @format
 */

import { NEWS_CAPTIONS, POP_STICKERS } from "../data/themes";

const WIDTH = 1200;

const FONT = {
  display: '"Barlow Condensed", "Arial Narrow", Impact, sans-serif',
  mono: '"IBM Plex Mono", Consolas, monospace',
  serif: 'Georgia, "Times New Roman", serif',
};

// Canvas tidak menunggu font CSS, jadi font dipanggil dulu sebelum menggambar.
const FONT_FACES = [
  '900 64px "Barlow Condensed"',
  '800 64px "Barlow Condensed"',
  '400 32px "IBM Plex Mono"',
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

const TICKET = {
  outer: "#5E0E1D",
  paper: "#F7EEDF",
  ink: "#4A0C17",
  red: "#D71920",
  muted: "#9A7064",
};

const NEWS = {
  paper: "#EFE7D4",
  ink: "#1C1915",
  gray: "#5F574D",
  tint: "#EADFC6",
};

const POP = {
  yellow: "#FFD500",
  ink: "#111111",
  red: "#EF233C",
  white: "#FFFFFF",
};

const NEON = {
  top: "#090420",
  bottom: "#1B0A3F",
  cyan: "#3DF5FF",
  pink: "#FF3DCB",
  white: "#F5F2FF",
  rec: "#FF3B5C",
};

async function loadFonts() {
  if (typeof document === "undefined" || !document.fonts?.load) return;

  const sample = "TEKNIK FEST 2026 Jepret 0123456789";
  const loading = Promise.allSettled(
    FONT_FACES.map((font) => document.fonts.load(font, sample)),
  );

  // Kolase tetap dibuat walau font lambat dimuat.
  await Promise.race([
    loading,
    new Promise((resolve) => setTimeout(resolve, 2500)),
  ]);
}

// Memuat foto (data URL / blob URL) menjadi objek Image
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Salah satu foto gagal dibuka."));

    image.src = src;
  });
}

function pad(value) {
  return String(value).padStart(2, "0");
}

// Tanggal & jam pemotretan yang dicetak di photocard.
function getStamp(value) {
  const parsed = new Date(value ?? Date.now());
  const date = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  const dd = pad(date.getDate());
  const mm = pad(date.getMonth() + 1);
  const hh = pad(date.getHours());
  const mi = pad(date.getMinutes());
  const month = MONTHS[date.getMonth()];
  const year = date.getFullYear();

  return {
    longDate: `${DAYS[date.getDay()]}, ${date.getDate()} ${month} ${year}`,
    shortDate: `${date.getDate()} ${month.slice(0, 3)} ${year}`,
    numericDate: `${dd}.${mm}.${year}`,
    time: `${hh}.${mi}`,
    serial: `${mm}${dd}-${hh}${mi}`,
    seed: Math.floor(date.getTime() / 1000),
  };
}

// Acak dengan seed supaya tekstur & barcode tidak berubah saat tema diganti bolak-balik.
function createRandom(seed) {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function drawText(
  ctx,
  value,
  x,
  y,
  { font, color, align = "left", spacing = 0 },
) {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";

  if (spacing && "letterSpacing" in ctx) {
    ctx.letterSpacing = `${spacing}px`;
    // letterSpacing juga menambah jarak setelah huruf terakhir.
    const shift =
      align === "center" ? spacing / 2 : align === "right" ? spacing : 0;
    ctx.fillText(value, x + shift, y);
    ctx.letterSpacing = "0px";
    return;
  }

  ctx.fillText(value, x, y);
}

function textWidth(ctx, value, font, spacing = 0) {
  ctx.font = font;
  const extra = spacing && "letterSpacing" in ctx ? spacing * value.length : 0;
  return ctx.measureText(value).width + extra;
}

function fitFont(ctx, value, maxWidth, maxSize, build, minSize = 14) {
  let size = maxSize;
  ctx.font = build(size);

  while (size > minSize && ctx.measureText(value).width > maxWidth) {
    size -= 2;
    ctx.font = build(size);
  }

  return size;
}

function wrapText(ctx, value, maxWidth) {
  const lines = [];
  let line = "";

  value.split(" ").forEach((word) => {
    const next = line ? `${line} ${word}` : word;

    if (line && ctx.measureText(next).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  });

  if (line) lines.push(line);
  return lines;
}

function drawRule(ctx, x1, x2, y, weight, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x1, y - weight / 2, x2 - x1, weight);
}

// Slot sudah mengikuti rasio kamera, jadi mode cover hampir tidak memotong foto.
function drawCover(ctx, image, x, y, w, h) {
  const scale = Math.max(w / image.width, h / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(
    image,
    x + (w - drawWidth) / 2,
    y + (h - drawHeight) / 2,
    drawWidth,
    drawHeight,
  );
  ctx.restore();
}

// Bintik halus ala kertas cetak.
function createGrain(ctx, random, strength) {
  const size = 180;
  const tile = document.createElement("canvas");
  tile.width = size;
  tile.height = size;

  const tileCtx = tile.getContext("2d");
  const pixels = tileCtx.createImageData(size, size);

  for (let i = 0; i < pixels.data.length; i += 4) {
    const tone = random() < 0.5 ? 0 : 255;
    pixels.data[i] = tone;
    pixels.data[i + 1] = tone;
    pixels.data[i + 2] = tone;
    pixels.data[i + 3] = random() * 255 * strength;
  }

  tileCtx.putImageData(pixels, 0, 0);
  return ctx.createPattern(tile, "repeat");
}

function createDotPattern(ctx, color, size, radius) {
  const tile = document.createElement("canvas");
  tile.width = size;
  tile.height = size;

  const tileCtx = tile.getContext("2d");
  tileCtx.fillStyle = color;
  tileCtx.beginPath();
  tileCtx.arc(size / 2, size / 2, radius, 0, Math.PI * 2);
  tileCtx.fill();

  return ctx.createPattern(tile, "repeat");
}

// Titik raster yang mengecil menjauhi sudut, khas pop art.
function drawHalftone(
  ctx,
  originX,
  originY,
  reach,
  maxRadius,
  step,
  color,
  height,
) {
  ctx.fillStyle = color;

  const startY = Math.max(0, Math.floor((originY - reach) / step) * step);
  const endY = Math.min(height, originY + reach);

  for (let y = startY; y <= endY; y += step) {
    const offset = (Math.round(y / step) % 2) * (step / 2);

    for (let x = offset; x <= WIDTH; x += step) {
      const radius =
        maxRadius * (1 - Math.hypot(x - originX, y - originY) / reach);

      if (radius < 0.8) continue;

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawGlow(ctx, x, y, radius, rgb, alpha) {
  const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
  glow.addColorStop(0, `rgba(${rgb}, ${alpha})`);
  glow.addColorStop(1, `rgba(${rgb}, 0)`);

  ctx.fillStyle = glow;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

// Menggambar kotak dengan sudut membulat
function roundedRect(ctx, x, y, w, h, radius) {
  const r = Math.min(radius, w / 2, h / 2);

  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// 1–3 foto: satu kolom. 4 & 6 foto: dua kolom.
// 5 foto: satu besar di atas, lalu 2 × 2.
function buildLayout(count, imageRatio, spec) {
  const { top, bottom, side, gap, pad = 0, caption = 0 } = spec;
  const contentWidth = WIDTH - side * 2;
  const ratio =
    Number.isFinite(imageRatio) && imageRatio > 0 ? imageRatio : 16 / 9;

  const rows =
    count === 4
      ? [2, 2]
      : count === 5
        ? [1, 2, 2]
        : count === 6
          ? [2, 2, 2]
          : Array(count).fill(1);

  const slots = [];
  let y = top;

  rows.forEach((columns) => {
    const w = (contentWidth - gap * (columns - 1)) / columns;
    const photoWidth = w - pad * 2;
    const photoHeight = Math.round(photoWidth / ratio);
    const h = photoHeight + pad * 2 + caption;

    for (let column = 0; column < columns; column++) {
      const x = side + column * (w + gap);

      slots.push({
        x,
        y,
        w,
        h,
        photo: { x: x + pad, y: y + pad, w: photoWidth, h: photoHeight },
      });
    }

    y += h + gap;
  });

  const photosBottom = y - gap;

  return {
    slots,
    photosBottom,
    height: Math.ceil(photosBottom + bottom),
  };
}

/* ---------- TEMA 01 · TIKET MASUK ---------- */

// Bentuk tiket dengan lekukan setengah lingkaran di garis sobekan.
function ticketPath(ctx, x, y, w, h, radius, notchY, notchRadius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.lineTo(x + w, notchY - notchRadius);
  ctx.arc(x + w, notchY, notchRadius, -Math.PI / 2, Math.PI / 2, true);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.lineTo(x, notchY + notchRadius);
  ctx.arc(x, notchY, notchRadius, Math.PI / 2, -Math.PI / 2, true);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawStamp(ctx, x, y, radius, angle, footnote, random) {
  const color = TICKET.red;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.globalAlpha = 0.88;
  ctx.strokeStyle = color;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, radius - 13, 0, Math.PI * 2);
  ctx.stroke();

  const big = `900 44px ${FONT.display}`;
  drawText(ctx, "SUDAH", 0, -12, {
    font: big,
    color,
    align: "center",
    spacing: 3,
  });
  drawText(ctx, "DIFOTO", 0, 28, {
    font: big,
    color,
    align: "center",
    spacing: 3,
  });
  drawText(ctx, footnote, 0, 56, {
    font: `600 14px ${FONT.mono}`,
    color,
    align: "center",
    spacing: 2,
  });

  // Bercak kosong biar mirip cap stempel karet.
  ctx.fillStyle = TICKET.paper;
  for (let i = 0; i < 110; i++) {
    const angleDot = random() * Math.PI * 2;
    const distance = Math.sqrt(random()) * (radius + 4);

    ctx.globalAlpha = 0.35 + random() * 0.55;
    ctx.beginPath();
    ctx.arc(
      Math.cos(angleDot) * distance,
      Math.sin(angleDot) * distance,
      0.8 + random() * 2.2,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }

  ctx.restore();
}

function drawTicket(ctx, images, { height, layout, stamp }) {
  const c = TICKET;
  const random = createRandom(stamp.seed);
  const edge = 40;
  const left = 96;
  const right = WIDTH - 96;
  const center = WIDTH / 2;
  const perfY = layout.photosBottom + 52;
  const shape = () =>
    ticketPath(
      ctx,
      edge,
      edge,
      WIDTH - edge * 2,
      height - edge * 2,
      28,
      perfY,
      30,
    );

  ctx.fillStyle = c.outer;
  ctx.fillRect(0, 0, WIDTH, height);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.045)";
  ctx.lineWidth = 12;
  for (let x = -height; x < WIDTH; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + height, height);
    ctx.stroke();
  }

  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.35)";
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 10;
  ctx.fillStyle = c.paper;
  shape();
  ctx.fill();
  ctx.restore();

  ctx.save();
  shape();
  ctx.clip();
  ctx.fillStyle = createGrain(ctx, random, 0.07);
  ctx.fillRect(0, 0, WIDTH, height);
  ctx.strokeStyle = "rgba(74, 12, 23, 0.3)";
  ctx.lineWidth = 2;
  roundedRect(
    ctx,
    edge + 16,
    edge + 16,
    WIDTH - (edge + 16) * 2,
    height - (edge + 16) * 2,
    14,
  );
  ctx.stroke();
  ctx.restore();

  // Kepala tiket
  const small = `600 21px ${FONT.mono}`;
  drawText(ctx, "TIKET MASUK · PHOTOBOOTH", left, 118, {
    font: small,
    color: c.ink,
    spacing: 3,
  });
  drawText(ctx, `NO. ${stamp.serial}`, right, 118, {
    font: small,
    color: c.red,
    align: "right",
    spacing: 3,
  });
  drawRule(ctx, left, right, 142, 3, c.ink);

  const titleSize = fitFont(
    ctx,
    "TEKNIK FEST",
    right - left,
    196,
    (size) => `900 ${size}px ${FONT.display}`,
  );
  drawText(ctx, "TEKNIK FEST", center, 312, {
    font: `900 ${titleSize}px ${FONT.display}`,
    color: c.ink,
    align: "center",
  });

  drawRule(ctx, left, right, 338, 3, c.ink);
  drawRule(ctx, left, right, 436, 3, c.ink);

  const cellWidth = (right - left) / 3;
  const cells = [
    ["TANGGAL", stamp.shortDate.toUpperCase()],
    ["JAM", stamp.time],
    ["ISI", `${images.length} FOTO`],
  ];

  cells.forEach(([label, value], index) => {
    const cellCenter = left + cellWidth * index + cellWidth / 2;

    if (index > 0) {
      ctx.fillStyle = c.ink;
      ctx.fillRect(left + cellWidth * index - 1, 338, 2, 98);
    }

    drawText(ctx, label, cellCenter, 372, {
      font: `600 17px ${FONT.mono}`,
      color: c.muted,
      align: "center",
      spacing: 4,
    });
    drawText(ctx, value, cellCenter, 418, {
      font: `800 42px ${FONT.display}`,
      color: c.ink,
      align: "center",
      spacing: 1,
    });
  });

  // Foto berbingkai garis tipis + nomor urut
  layout.slots.forEach((slot, index) => {
    const photo = slot.photo;

    ctx.fillStyle = c.ink;
    ctx.fillRect(slot.x, slot.y, slot.w, slot.h);
    ctx.fillStyle = c.paper;
    ctx.fillRect(slot.x + 3, slot.y + 3, slot.w - 6, slot.h - 6);
    drawCover(ctx, images[index], photo.x, photo.y, photo.w, photo.h);

    ctx.fillStyle = c.ink;
    ctx.fillRect(slot.x, slot.y, 66, 36);
    drawText(ctx, pad(index + 1), slot.x + 33, slot.y + 25, {
      font: `600 19px ${FONT.mono}`,
      color: c.paper,
      align: "center",
      spacing: 2,
    });
  });

  // Garis sobekan
  ctx.save();
  ctx.setLineDash([16, 12]);
  ctx.strokeStyle = "rgba(74, 12, 23, 0.5)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(edge + 46, perfY);
  ctx.lineTo(WIDTH - edge - 46, perfY);
  ctx.stroke();
  ctx.restore();
  drawText(ctx, "SOBEK DI SINI", left, perfY - 16, {
    font: `600 15px ${FONT.mono}`,
    color: c.muted,
    spacing: 4,
  });

  // Potongan tiket: barcode hiasan (bukan data), pesan, stempel
  const barTop = perfY + 46;
  const barHeight = 94;
  ctx.fillStyle = c.ink;
  for (let x = left; x < left + 430; ) {
    const bar = [2, 3, 4, 6][Math.floor(random() * 4)];
    ctx.fillRect(x, barTop, bar, barHeight);
    x += bar + [2, 3, 5][Math.floor(random() * 3)];
  }
  drawText(ctx, `TF26-${stamp.serial}`, left, barTop + barHeight + 34, {
    font: `600 21px ${FONT.mono}`,
    color: c.ink,
    spacing: 7,
  });

  const note = `800 32px ${FONT.display}`;
  drawText(ctx, "SIMPAN BAIK-BAIK,", 560, perfY + 104, {
    font: note,
    color: c.ink,
    spacing: 1,
  });
  drawText(ctx, "INI BUKTI KAMU DATANG.", 560, perfY + 144, {
    font: note,
    color: c.red,
    spacing: 1,
  });

  drawStamp(ctx, right - 92, perfY + 122, 92, -0.22, stamp.numericDate, random);
}

/* ---------- TEMA 02 · KORAN KAMPUS ---------- */

function drawRetro(ctx, images, { height, layout, spec, stamp }) {
  const c = NEWS;
  const random = createRandom(stamp.seed + 7);
  const left = spec.side;
  const right = WIDTH - spec.side;
  const center = WIDTH / 2;
  const count = images.length;
  const small = `600 17px ${FONT.mono}`;

  ctx.fillStyle = c.paper;
  ctx.fillRect(0, 0, WIDTH, height);

  // Kepala koran
  drawText(ctx, "EDISI KHUSUS PHOTOBOOTH", left, 58, {
    font: small,
    color: c.ink,
    spacing: 3,
  });
  drawText(ctx, "HARGA Rp0,-", right, 58, {
    font: small,
    color: c.ink,
    align: "right",
    spacing: 3,
  });
  drawRule(ctx, left, right, 78, 2, c.ink);

  const masthead = "Harian Teknik Fest";
  const mastSize = fitFont(
    ctx,
    masthead,
    right - left,
    122,
    (size) => `700 ${size}px ${FONT.serif}`,
  );
  drawText(ctx, masthead, center, 192, {
    font: `700 ${mastSize}px ${FONT.serif}`,
    color: c.ink,
    align: "center",
  });

  drawRule(ctx, left, right, 220, 6, c.ink);
  drawRule(ctx, left, right, 232, 2, c.ink);
  drawText(ctx, stamp.longDate.toUpperCase(), left, 264, {
    font: small,
    color: c.ink,
    spacing: 2,
  });
  drawText(ctx, `NO. ${stamp.serial}`, center, 264, {
    font: small,
    color: c.ink,
    align: "center",
    spacing: 2,
  });
  drawText(ctx, `${count} FOTO`, right, 264, {
    font: small,
    color: c.ink,
    align: "right",
    spacing: 2,
  });
  drawRule(ctx, left, right, 284, 2, c.ink);

  // Judul berita + ringkasan
  const headline = "TERTANGKAP KAMERA!";
  const headSize = fitFont(
    ctx,
    headline,
    right - left,
    136,
    (size) => `900 ${size}px ${FONT.display}`,
  );
  drawText(ctx, headline, center, 400, {
    font: `900 ${headSize}px ${FONT.display}`,
    color: c.ink,
    align: "center",
  });

  const deck = `Pengunjung Teknik Fest kepergok bergaya di depan booth. Redaksi berhasil mengamankan ${count} foto sebagai barang bukti.`;
  let deckSize = 30;
  ctx.font = `italic ${deckSize}px ${FONT.serif}`;
  let lines = wrapText(ctx, deck, 1000);

  while (lines.length > 2 && deckSize > 20) {
    deckSize -= 1;
    ctx.font = `italic ${deckSize}px ${FONT.serif}`;
    lines = wrapText(ctx, deck, 1000);
  }

  lines.forEach((line, index) => {
    drawText(ctx, line, center, 454 + index * 40, {
      font: `italic ${deckSize}px ${FONT.serif}`,
      color: c.gray,
      align: "center",
    });
  });
  drawRule(ctx, left, right, 522, 2, c.ink);

  // Foto hitam-putih bertekstur cetak + keterangan
  const dots = createDotPattern(ctx, "rgba(28, 25, 21, 0.16)", 6, 1.1);

  layout.slots.forEach((slot, index) => {
    const photo = slot.photo;

    ctx.save();
    ctx.filter = "grayscale(1) contrast(1.15) brightness(1.04)";
    drawCover(ctx, images[index], photo.x, photo.y, photo.w, photo.h);
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.rect(photo.x, photo.y, photo.w, photo.h);
    ctx.clip();
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = c.tint;
    ctx.fillRect(photo.x, photo.y, photo.w, photo.h);
    ctx.fillStyle = dots;
    ctx.fillRect(photo.x, photo.y, photo.w, photo.h);
    ctx.restore();

    ctx.strokeStyle = c.ink;
    ctx.lineWidth = 2;
    ctx.strokeRect(photo.x + 1, photo.y + 1, photo.w - 2, photo.h - 2);

    const captionY = photo.y + photo.h + 36;
    const label = `FOTO ${index + 1}.`;
    const labelFont = `800 24px ${FONT.display}`;
    const labelWidth = textWidth(ctx, label, labelFont, 1);
    const caption = NEWS_CAPTIONS[index] || "";
    const captionSize = fitFont(
      ctx,
      caption,
      photo.w - labelWidth - 12,
      22,
      (size) => `italic ${size}px ${FONT.serif}`,
      15,
    );

    drawText(ctx, label, photo.x, captionY, {
      font: labelFont,
      color: c.ink,
      spacing: 1,
    });
    drawText(ctx, caption, photo.x + labelWidth + 10, captionY, {
      font: `italic ${captionSize}px ${FONT.serif}`,
      color: c.gray,
    });

    // Garis kolom & garis antarbaris khas koran
    if (slot.x > left + 1) {
      ctx.fillStyle = c.ink;
      ctx.fillRect(slot.x - spec.gap / 2 - 0.75, slot.y, 1.5, slot.h);
    } else if (slot.y > spec.top + 1) {
      drawRule(ctx, left, right, slot.y - spec.gap / 2, 1.5, c.ink);
    }
  });

  // Kaki koran
  const footY = layout.photosBottom + 30;
  drawRule(ctx, left, right, footY, 5, c.ink);
  drawRule(ctx, left, right, footY + 11, 2, c.ink);
  drawText(ctx, "DICETAK DI PHOTOBOOTH TEKNIK FEST", left, footY + 54, {
    font: small,
    color: c.ink,
    spacing: 3,
  });
  drawText(ctx, "HAL. 1", right, footY + 56, {
    font: `800 30px ${FONT.display}`,
    color: c.ink,
    align: "right",
    spacing: 2,
  });

  // Serat kertas dan tepi yang agak menguning
  ctx.fillStyle = createGrain(ctx, random, 0.08);
  ctx.fillRect(0, 0, WIDTH, height);

  const aged = ctx.createRadialGradient(
    center,
    height / 2,
    Math.min(WIDTH, height) * 0.35,
    center,
    height / 2,
    Math.hypot(WIDTH, height) / 2,
  );
  aged.addColorStop(0, "rgba(120, 90, 45, 0)");
  aged.addColorStop(1, "rgba(120, 90, 45, 0.22)");
  ctx.fillStyle = aged;
  ctx.fillRect(0, 0, WIDTH, height);
}

/* ---------- TEMA 03 · KOMIK POP ---------- */

// Kotak teks bergaya komik: garis tebal + bayangan keras.
function drawTag(ctx, value, x, y, options) {
  const {
    size,
    weight = 900,
    family = FONT.display,
    fill,
    color,
    angle = 0,
    padX = 18,
    height = 54,
    shadow = 7,
    spacing = 1,
    anchor = "left",
  } = options;
  const font = `${weight} ${size}px ${family}`;
  const width = textWidth(ctx, value, font, spacing) + padX * 2;
  const originX = anchor === "center" ? x : x + width / 2;

  ctx.save();
  ctx.translate(originX, y + height / 2);
  ctx.rotate(angle);

  if (shadow) {
    ctx.fillStyle = POP.ink;
    ctx.fillRect(-width / 2 + shadow, -height / 2 + shadow, width, height);
  }

  ctx.fillStyle = fill;
  ctx.fillRect(-width / 2, -height / 2, width, height);
  ctx.lineWidth = 4;
  ctx.strokeStyle = POP.ink;
  ctx.strokeRect(-width / 2, -height / 2, width, height);
  drawText(ctx, value, 0, size * 0.35, {
    font,
    color,
    align: "center",
    spacing,
  });
  ctx.restore();
}

function drawBurst(
  ctx,
  x,
  y,
  { outer, inner, points, fill, text, size, angle, random },
) {
  const jitter = Array.from(
    { length: points * 2 },
    () => 0.9 + random() * 0.18,
  );
  const path = () => {
    ctx.beginPath();

    for (let i = 0; i < points * 2; i++) {
      const radius = (i % 2 === 0 ? outer : inner) * jitter[i];
      const theta = -Math.PI / 2 + (i * Math.PI) / points;
      const px = Math.cos(theta) * radius;
      const py = Math.sin(theta) * radius;

      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }

    ctx.closePath();
  };

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  ctx.save();
  ctx.translate(9, 9);
  path();
  ctx.fillStyle = POP.ink;
  ctx.fill();
  ctx.restore();

  path();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.lineJoin = "round";
  ctx.strokeStyle = POP.ink;
  ctx.stroke();

  ctx.font = `900 ${size}px ${FONT.display}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.lineWidth = 8;
  ctx.strokeText(text, 0, size * 0.35);
  ctx.fillStyle = POP.white;
  ctx.fillText(text, 0, size * 0.35);
  ctx.restore();
}

function drawPop(ctx, images, { height, layout, stamp }) {
  const c = POP;
  const random = createRandom(stamp.seed + 13);
  const center = WIDTH / 2;
  const count = images.length;

  ctx.fillStyle = c.yellow;
  ctx.fillRect(0, 0, WIDTH, height);

  // Sinar dari belakang judul
  ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
  const rays = 28;
  const reach = Math.max(WIDTH, height) * 1.5;
  for (let i = 0; i < rays; i += 2) {
    const a1 = (i / rays) * Math.PI * 2;
    const a2 = ((i + 1) / rays) * Math.PI * 2;

    ctx.beginPath();
    ctx.moveTo(center, 260);
    ctx.lineTo(center + Math.cos(a1) * reach, 260 + Math.sin(a1) * reach);
    ctx.lineTo(center + Math.cos(a2) * reach, 260 + Math.sin(a2) * reach);
    ctx.closePath();
    ctx.fill();
  }

  drawHalftone(ctx, WIDTH, 0, 820, 11, 26, "rgba(239, 35, 60, 0.5)", height);
  drawHalftone(ctx, 0, height, 820, 11, 26, "rgba(239, 35, 60, 0.5)", height);

  // Kotak narasi khas komik
  drawTag(ctx, "SEMENTARA ITU, DI TEKNIK FEST…", 84, 50, {
    size: 30,
    weight: 800,
    fill: c.white,
    color: c.ink,
    angle: -0.03,
    height: 60,
    shadow: 8,
  });

  drawBurst(ctx, 1082, 106, {
    outer: 94,
    inner: 68,
    points: 14,
    fill: c.red,
    text: "JEPRET!",
    size: 40,
    angle: 0.16,
    random,
  });

  // Judul miring bergaris tebal
  const title = "TEKNIK FEST";
  const titleSize = fitFont(
    ctx,
    title,
    900,
    190,
    (size) => `900 ${size}px ${FONT.display}`,
  );
  ctx.save();
  ctx.translate(center - 10, 342);
  ctx.transform(1, 0, -0.16, 1, 0, 0);
  ctx.font = `900 ${titleSize}px ${FONT.display}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.lineJoin = "round";
  ctx.lineWidth = 18;
  ctx.strokeStyle = c.ink;
  ctx.fillStyle = c.red;
  ctx.strokeText(title, 16, 16);
  ctx.fillText(title, 16, 16);
  ctx.strokeText(title, 0, 0);
  ctx.fillStyle = c.white;
  ctx.fillText(title, 0, 0);
  ctx.restore();

  drawTag(
    ctx,
    `EDISI POP · ${stamp.numericDate} · ${count} PANEL`,
    center,
    372,
    {
      size: 20,
      weight: 600,
      family: FONT.mono,
      fill: c.ink,
      color: c.yellow,
      angle: 0.015,
      height: 44,
      shadow: 0,
      spacing: 3,
      anchor: "center",
    },
  );

  // Panel foto: bingkai putih, garis hitam, bayangan keras, sedikit miring
  const tilts = [-1.6, 1.3, -1.1, 1.5, -1.3, 1];

  layout.slots.forEach((slot, index) => {
    const photo = slot.photo;
    const inset = photo.x - slot.x;

    ctx.save();
    ctx.translate(slot.x + slot.w / 2, slot.y + slot.h / 2);
    ctx.rotate((tilts[index] * Math.PI) / 180);

    const x = -slot.w / 2;
    const y = -slot.h / 2;

    ctx.fillStyle = c.ink;
    ctx.fillRect(x + 14, y + 14, slot.w, slot.h);
    ctx.fillStyle = c.white;
    ctx.fillRect(x, y, slot.w, slot.h);
    drawCover(ctx, images[index], x + inset, y + inset, photo.w, photo.h);
    ctx.lineWidth = 6;
    ctx.strokeStyle = c.ink;
    ctx.strokeRect(x, y, slot.w, slot.h);
    ctx.lineWidth = 3;
    ctx.strokeRect(x + inset, y + inset, photo.w, photo.h);
    ctx.restore();

    const red = index % 2 === 1;
    drawTag(ctx, POP_STICKERS[index] || "WOW!", slot.x - 12, slot.y - 22, {
      size: 34,
      fill: red ? c.red : c.white,
      color: red ? c.white : c.ink,
      angle: red ? 0.07 : -0.08,
      height: 52,
      shadow: 6,
      padX: 14,
    });
  });

  // Penutup: strip hitam + "BERSAMBUNG…"
  const stripTop = height - 100;
  ctx.fillStyle = c.ink;
  ctx.fillRect(0, stripTop, WIDTH, 100);
  drawText(ctx, "TEKNIK FEST 2026", 84, stripTop + 66, {
    font: `900 50px ${FONT.display}`,
    color: c.yellow,
    spacing: 2,
  });
  drawText(
    ctx,
    `${stamp.numericDate} · ${stamp.time}`,
    WIDTH - 84,
    stripTop + 60,
    {
      font: `600 19px ${FONT.mono}`,
      color: c.white,
      align: "right",
      spacing: 3,
    },
  );

  const nextWidth =
    textWidth(ctx, "BERSAMBUNG…", `900 40px ${FONT.display}`, 2) + 40;
  drawTag(ctx, "BERSAMBUNG…", WIDTH - 84 - nextWidth, stripTop - 40, {
    size: 40,
    fill: c.white,
    color: c.ink,
    angle: -0.035,
    height: 62,
    shadow: 8,
    padX: 20,
    spacing: 2,
  });
}

/* ---------- TEMA 04 · NEON MALAM ---------- */

function drawSun(ctx, centerX, horizon, radius) {
  const tile = document.createElement("canvas");
  tile.width = radius * 2;
  tile.height = radius;

  const sun = tile.getContext("2d");
  const fill = sun.createLinearGradient(0, 0, 0, radius);
  fill.addColorStop(0, "#FFE66D");
  fill.addColorStop(0.5, "#FF8A3D");
  fill.addColorStop(1, NEON.pink);
  sun.fillStyle = fill;
  sun.beginPath();
  sun.arc(radius, radius, radius, Math.PI, 0);
  sun.closePath();
  sun.fill();

  // Potongan garis horizontal khas matahari retro
  sun.globalCompositeOperation = "destination-out";
  for (let i = 0; i < 5; i++) {
    sun.fillRect(0, radius * (0.46 + i * 0.09), radius * 2, 3 + i * 2.6);
  }

  ctx.save();
  ctx.shadowColor = "rgba(255, 61, 203, 0.8)";
  ctx.shadowBlur = 70;
  ctx.drawImage(tile, centerX - radius, horizon - radius);
  ctx.restore();
}

// Tampilan layar kamera yang sedang merekam, di atas tiap foto.
function drawCameraHud(ctx, photo, index, stamp) {
  const s = Math.max(0.62, Math.min(1, photo.w / 1000));
  const inset = 22 * s;
  const arm = 40 * s;
  const font = `600 ${Math.round(21 * s)}px ${FONT.mono}`;
  const x1 = photo.x + inset;
  const y1 = photo.y + inset;
  const x2 = photo.x + photo.w - inset;
  const y2 = photo.y + photo.h - inset;
  const textX = x1 + 16 * s;
  const topY = y1 + 38 * s;
  const bottomY = y2 - 18 * s;

  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
  ctx.shadowBlur = 8;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.92)";
  ctx.lineWidth = Math.max(2, 3 * s);
  ctx.beginPath();
  ctx.moveTo(x1, y1 + arm);
  ctx.lineTo(x1, y1);
  ctx.lineTo(x1 + arm, y1);
  ctx.moveTo(x2 - arm, y1);
  ctx.lineTo(x2, y1);
  ctx.lineTo(x2, y1 + arm);
  ctx.moveTo(x2, y2 - arm);
  ctx.lineTo(x2, y2);
  ctx.lineTo(x2 - arm, y2);
  ctx.moveTo(x1 + arm, y2);
  ctx.lineTo(x1, y2);
  ctx.lineTo(x1, y2 - arm);
  ctx.stroke();

  ctx.fillStyle = NEON.rec;
  ctx.beginPath();
  ctx.arc(textX + 8 * s, topY - 8 * s, 8 * s, 0, Math.PI * 2);
  ctx.fill();
  drawText(ctx, "REC", textX + 24 * s, topY, {
    font,
    color: "#FFFFFF",
    spacing: 3 * s,
  });
  drawText(ctx, `CAM ${pad(index + 1)}`, x2 - 16 * s, topY, {
    font,
    color: "#FFFFFF",
    align: "right",
    spacing: 3 * s,
  });
  drawText(ctx, `${stamp.numericDate}  ${stamp.time}`, textX, bottomY, {
    font,
    color: "#FFFFFF",
    spacing: 2 * s,
  });

  const batteryW = 46 * s;
  const batteryH = 22 * s;
  const batteryX = x2 - 16 * s - batteryW - 5 * s;
  const batteryY = bottomY - batteryH + 3 * s;
  ctx.lineWidth = Math.max(1.5, 2 * s);
  ctx.strokeRect(batteryX, batteryY, batteryW, batteryH);
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(
    batteryX + batteryW,
    batteryY + batteryH * 0.3,
    4 * s,
    batteryH * 0.4,
  );
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(
      batteryX + 4 * s + i * 14 * s,
      batteryY + 4 * s,
      10 * s,
      batteryH - 8 * s,
    );
  }
  ctx.restore();
}

function drawNeon(ctx, images, { height, layout, spec, stamp }) {
  const c = NEON;
  const random = createRandom(stamp.seed + 21);
  const center = WIDTH / 2;
  const left = spec.side;
  const right = WIDTH - spec.side;
  const count = images.length;

  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, c.top);
  sky.addColorStop(0.65, "#12072F");
  sky.addColorStop(1, c.bottom);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WIDTH, height);

  drawGlow(ctx, 160, 140, 520, "255, 61, 203", 0.28);
  drawGlow(ctx, WIDTH - 120, height * 0.55, 620, "61, 245, 255", 0.12);

  ctx.fillStyle = c.white;
  for (let i = 0; i < 140; i++) {
    ctx.globalAlpha = 0.2 + random() * 0.6;
    ctx.beginPath();
    ctx.arc(
      random() * WIDTH,
      random() * height,
      0.5 + random() * 1.6,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = "rgba(255, 255, 255, 0.025)";
  for (let y = 0; y < height; y += 4) {
    ctx.fillRect(0, y, WIDTH, 1);
  }

  // Baris status kamera
  ctx.save();
  ctx.shadowColor = c.rec;
  ctx.shadowBlur = 14;
  ctx.fillStyle = c.rec;
  ctx.beginPath();
  ctx.arc(left + 9, 58, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  drawText(ctx, "REC", left + 28, 66, {
    font: `600 22px ${FONT.mono}`,
    color: c.white,
    spacing: 4,
  });
  drawText(ctx, `${stamp.numericDate} · ${stamp.time}`, right, 66, {
    font: `600 20px ${FONT.mono}`,
    color: c.cyan,
    align: "right",
    spacing: 3,
  });
  ctx.fillStyle = "rgba(61, 245, 255, 0.35)";
  ctx.fillRect(left, 92, right - left, 2);
  for (let x = left; x <= right; x += 42) {
    ctx.fillRect(x, 92, 2, 10);
  }

  // Judul neon dengan efek pecahan warna
  const title = "TEKNIK FEST";
  const titleSize = fitFont(
    ctx,
    title,
    980,
    186,
    (size) => `900 ${size}px ${FONT.display}`,
  );
  const titleFont = `900 ${titleSize}px ${FONT.display}`;
  const titleY = 268;

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = 0.8;
  drawText(ctx, title, center - 7, titleY, {
    font: titleFont,
    color: c.pink,
    align: "center",
    spacing: 4,
  });
  drawText(ctx, title, center + 7, titleY, {
    font: titleFont,
    color: c.cyan,
    align: "center",
    spacing: 4,
  });
  ctx.restore();

  const chrome = ctx.createLinearGradient(
    0,
    titleY - titleSize * 0.72,
    0,
    titleY,
  );
  chrome.addColorStop(0, "#FFFFFF");
  chrome.addColorStop(0.55, "#C9FBFF");
  chrome.addColorStop(1, "#FF8BE6");
  ctx.save();
  ctx.shadowColor = c.pink;
  ctx.shadowBlur = 34;
  drawText(ctx, title, center, titleY, {
    font: titleFont,
    color: chrome,
    align: "center",
    spacing: 4,
  });
  ctx.restore();

  drawText(ctx, `EDISI NEON MALAM · ${count} FOTO`, center, 322, {
    font: `600 22px ${FONT.mono}`,
    color: c.cyan,
    align: "center",
    spacing: 8,
  });

  layout.slots.forEach((slot, index) => {
    const photo = slot.photo;

    ctx.save();
    ctx.shadowColor = "rgba(61, 245, 255, 0.55)";
    ctx.shadowBlur = 34;
    ctx.fillStyle = "#000000";
    ctx.fillRect(photo.x, photo.y, photo.w, photo.h);
    ctx.restore();

    drawCover(ctx, images[index], photo.x, photo.y, photo.w, photo.h);

    const mood = ctx.createLinearGradient(0, photo.y, 0, photo.y + photo.h);
    mood.addColorStop(0.5, "rgba(255, 61, 203, 0)");
    mood.addColorStop(1, "rgba(255, 61, 203, 0.2)");
    ctx.fillStyle = mood;
    ctx.fillRect(photo.x, photo.y, photo.w, photo.h);

    ctx.strokeStyle = c.cyan;
    ctx.lineWidth = 3;
    ctx.strokeRect(photo.x - 1.5, photo.y - 1.5, photo.w + 3, photo.h + 3);

    drawCameraHud(ctx, photo, index, stamp);
  });

  // Matahari terbenam di atas lantai grid
  const horizon = layout.photosBottom + 240;
  drawSun(ctx, center, horizon, 176);

  const ground = ctx.createLinearGradient(0, horizon, 0, height);
  ground.addColorStop(0, "#1A0638");
  ground.addColorStop(1, "#06020F");
  ctx.fillStyle = ground;
  ctx.fillRect(0, horizon, WIDTH, height - horizon);

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, horizon, WIDTH, height - horizon);
  ctx.clip();
  ctx.strokeStyle = "rgba(255, 61, 203, 0.75)";
  ctx.lineWidth = 2;
  ctx.shadowColor = c.pink;
  ctx.shadowBlur = 10;
  const depth = height - horizon;
  ctx.beginPath();
  for (let i = 1; i <= 8; i++) {
    const y = horizon + depth * Math.pow(i / 8, 2);
    ctx.moveTo(0, y);
    ctx.lineTo(WIDTH, y);
  }
  for (let i = -14; i <= 14; i++) {
    ctx.moveTo(center + i * 16, horizon);
    ctx.lineTo(center + i * 170, height);
  }
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.shadowColor = c.cyan;
  ctx.shadowBlur = 20;
  ctx.fillStyle = c.cyan;
  ctx.fillRect(0, horizon - 1.5, WIDTH, 3);
  ctx.restore();

  drawText(ctx, `${count} FOTO`, left, horizon - 22, {
    font: `600 19px ${FONT.mono}`,
    color: c.cyan,
    spacing: 4,
  });
  drawText(ctx, "TEKNIK FEST 2026", right, horizon - 22, {
    font: `600 19px ${FONT.mono}`,
    color: c.cyan,
    align: "right",
    spacing: 4,
  });

  const fade = ctx.createLinearGradient(0, height - 110, 0, height);
  fade.addColorStop(0, "rgba(6, 2, 15, 0)");
  fade.addColorStop(1, "rgba(6, 2, 15, 0.9)");
  ctx.fillStyle = fade;
  ctx.fillRect(0, height - 110, WIDTH, 110);
  drawText(ctx, "DIREKAM DI PHOTOBOOTH TEKNIK FEST", center, height - 40, {
    font: `600 20px ${FONT.mono}`,
    color: c.white,
    align: "center",
    spacing: 6,
  });
}

// top/bottom = ruang kepala & kaki, side = margin kiri-kanan,
// pad = bingkai di sekeliling foto, caption = ruang keterangan di bawah foto.
const THEMES = {
  ticket: {
    layout: { top: 462, bottom: 340, side: 96, gap: 22, pad: 10 },
    draw: drawTicket,
  },
  retro: {
    layout: { top: 550, bottom: 130, side: 64, gap: 34, caption: 58 },
    draw: drawRetro,
  },
  pop: {
    layout: { top: 452, bottom: 230, side: 88, gap: 48, pad: 14 },
    draw: drawPop,
  },
  cyber: {
    layout: { top: 372, bottom: 390, side: 76, gap: 30 },
    draw: drawNeon,
  },
};

// FUNGSI UTAMA

export async function composePhotos(photos, themeId = "ticket", options = {}) {
  if (!Array.isArray(photos)) {
    throw new Error("Data foto harus berupa array.");
  }

  if (photos.length < 1 || photos.length > 6) {
    throw new Error("Jumlah foto harus antara 1 sampai 6.");
  }

  const theme = THEMES[themeId] || THEMES.ticket;

  const [images] = await Promise.all([
    Promise.all(photos.map((photo) => loadImage(photo))),
    loadFonts(),
  ]);

  const layout = buildLayout(
    images.length,
    images[0].width / images[0].height,
    theme.layout,
  );

  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = layout.height;

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Browser ini tidak bisa membuat kolase (Canvas 2D).");
  }

  theme.draw(ctx, images, {
    height: layout.height,
    layout,
    spec: theme.layout,
    stamp: getStamp(options.capturedAt),
  });

  return canvas;
}

// Mengubah Canvas menjadi JPEG
export function canvasToJPEG(canvas, quality = 0.95) {
  return canvas.toDataURL("image/jpeg", quality);
}

// Download hasil photobooth
export function downloadCanvas(
  canvas,
  filename = "Teknik-Fest-Photobooth.jpg",
) {
  const link = document.createElement("a");

  link.download = filename;
  link.href = canvasToJPEG(canvas);

  document.body.appendChild(link);
  link.click();
  link.remove();
}
