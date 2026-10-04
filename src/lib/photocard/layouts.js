/** @format */

// Semua photocard dicetak 4R: 4 × 6 inci = 1200 × 1800 px pada 300 dpi.
// Header/footer desain tetap di tempatnya; foto diisi ke area di antaranya.
export const CARD_WIDTH = 1200;
export const CARD_HEIGHT = 1800;
export const CARD_DPI = 300;
export const CARD_SIZE = {
  name: "4R",
  inches: "4 × 6 in",
  width: CARD_WIDTH,
  height: CARD_HEIGHT,
  dpi: CARD_DPI,
};

const W = CARD_WIDTH;
const H = CARD_HEIGHT;

// Batas potong foto kamera 16:9: tidak lebih sempit dari 5:4 (±70% lebar tetap terlihat), tidak lebih lebar dari 2:1.
const RATIO = { min: 1.25, max: 2 };
// Susunan desain dipakai selama area foto terisi cukup; di bawah ini baru coba susunan lain.
const MIN_FILL = 0.55;

const ARRANGEMENTS = {
  1: [[1]],
  2: [[1, 1], [2]],
  3: [
    [1, 1, 1],
    [1, 2],
    [2, 1],
  ],
  4: [
    [2, 2],
    [1, 3],
    [1, 1, 2],
    [1, 1, 1, 1],
  ],
  5: [
    [1, 2, 2],
    [2, 1, 2],
    [2, 2, 1],
    [1, 1, 3],
  ],
  6: [
    [2, 2, 2],
    [3, 3],
    [1, 2, 3],
    [1, 1, 2, 2],
  ],
};

// Susunan asli tiap jenis layout; dipakai selama hasilnya masuk akal di kartu 4R.
const PREFERRED = {
  auto: [[1], [1, 1], [1, 1, 1], [2, 2], [1, 2, 2], [2, 2, 2]],
  grid: [[1], [2], [1, 2], [2, 2], [1, 2, 2], [2, 2, 2]],
  polaroid: [[1], [1, 1], [1, 2], [2, 2], [1, 2, 2], [2, 2, 2]],
  film: [[1], [1, 1], [1, 1, 1], [2, 2], [1, 2, 2], [2, 2, 2]],
  feature: [[1], [1, 1], [1, 2], [1, 3], [1, 2, 2], [1, 3, 2]],
};

function bodyArea({ top, side, bottom }) {
  return { x: side, y: top, w: W - side * 2, h: H - bottom - top };
}

// Satu rasio foto untuk semua slot. Kalau area terlalu pendek, blok menyempit;
// kalau terlalu tinggi, blok ditaruh di tengah. Foto tidak pernah ditarik.
function fitRows(
  rows,
  area,
  { gap, extra = 0, inset = 0, min, max, align = "center" },
) {
  const fixedH = gap * (rows.length - 1) + extra * rows.length;
  const room = Math.max(1, area.h - fixedH);
  const k = rows.reduce((sum, columns) => sum + 1 / columns, 0);
  const b = rows.reduce(
    (sum, columns) => sum + (gap * (columns - 1)) / columns + inset * 2,
    0,
  );

  let blockW = area.w;
  let ratio = (k * blockW - b) / room;
  if (ratio > max) {
    ratio = max;
    blockW = (max * room + b) / k;
  } else if (ratio < min) {
    ratio = min;
  }

  const blockH = (k * blockW - b) / ratio + fixedH;
  const x0 = area.x + (area.w - blockW) / 2;
  let y = area.y + (align === "top" ? 0 : (area.h - blockH) / 2);
  const slots = [];

  rows.forEach((columns, row) => {
    const cellW = (blockW - gap * (columns - 1)) / columns;
    const w = cellW - inset * 2;
    const h = w / ratio;
    for (let column = 0; column < columns; column++) {
      const x = x0 + column * (cellW + gap);
      slots.push({
        x: x + inset,
        y: y + inset,
        w,
        h,
        row,
        column,
        cell: { x, y, w: cellW, h: h + extra },
      });
    }
    y += h + extra + gap;
  });

  return { slots, ratio, blockW, blockH };
}

// Susunan desain dipertahankan (sesuai format di landing); susunan lain hanya kalau area terlalu kosong.
function arrange(count, preferred, area, options) {
  const fill = (fit) => (fit.blockW * fit.blockH) / (area.w * area.h);
  const first = fitRows(preferred, area, options);
  if (fill(first) >= MIN_FILL) return first;

  let best = first;
  ARRANGEMENTS[count].forEach((rows) => {
    const fit = fitRows(rows, area, options);
    if (fill(fit) > fill(best) + 0.08) best = fit;
  });
  return best;
}

const plain = ({ slots }) => slots.map(({ x, y, w, h }) => ({ x, y, w, h }));

function rowsLayout(kind) {
  return (count, camera, spacing) => {
    const fit = arrange(count, PREFERRED[kind][count - 1], bodyArea(spacing), {
      gap: spacing.gap,
      min: RATIO.min,
      max: RATIO.max,
    });
    return { slots: plain(fit), bodyBottom: H - spacing.bottom, height: H };
  };
}

const auto = rowsLayout("auto");
const grid = rowsLayout("grid");
const film = rowsLayout("film");
const feature = rowsLayout("feature");

// Tiap foto dalam bingkai berpinggiran bawah tebal, sedikit miring bergantian.
function polaroid(count, camera, spacing) {
  const { gap, pad = 24, caption = 90, tilt = true } = spacing;
  const fit = arrange(count, PREFERRED.polaroid[count - 1], bodyArea(spacing), {
    gap,
    extra: pad + caption,
    inset: pad,
    min: RATIO.min,
    max: 1.9,
  });

  const slots = fit.slots.map(({ x, y, w, h, row, column, cell }) => ({
    x,
    y,
    w,
    h,
    frame: cell,
    rotate: tilt
      ? ((row + column) % 2 ? 1 : -1) * (1.4 + ((row + column * 2) % 3) * 0.6)
      : 0,
    pivot: { x: cell.x + cell.w / 2, y: cell.y + cell.h / 2 },
  }));
  return { slots, bodyBottom: H - spacing.bottom, height: H };
}

// Cetakan berserakan: zig-zag kiri-kanan, saling tumpuk sedikit.
function collage(count, camera, spacing) {
  const { side, border = 16 } = spacing;
  const area = bodyArea(spacing);
  const step = 0.72;
  const share = [0.86, 0.78, 0.66, 0.6, 0.56, 0.52][count - 1];

  let h = (area.h - border * 2 - 24) / (1 + (count - 1) * step);
  let w = h * camera;
  if (w > W * share) {
    w = W * share;
    h = w / camera;
  }

  const used = h * (1 + (count - 1) * step) + border * 2 + 24;
  let y = area.y + border + (area.h - used) / 2;
  const slots = [];

  for (let index = 0; index < count; index++) {
    const left = index % 2 === 0;
    const x = count === 1 ? (W - w) / 2 : left ? side + 10 : W - side - w - 10;
    const rotate =
      count === 1
        ? -2
        : left
          ? -3.4 + (index % 3) * 0.8
          : 3 - (index % 3) * 0.7;
    slots.push({
      x,
      y,
      w,
      h,
      rotate,
      pivot: { x: x + w / 2, y: y + h / 2 },
      frame: {
        x: x - border,
        y: y - border,
        w: w + border * 2,
        h: h + border * 2,
      },
    });
    y += h * step;
  }

  return { slots, bodyBottom: H - spacing.bottom, height: H };
}

// Sampul penuh di atas + foto sisanya sebagai sisipan. Sampul paling tinggi 5:4;
// sampul tunggal setinggi kartu: foto tajam 5:4 di tengah, latar foto yang sama di-blur.
function magazine(count, camera, spacing) {
  const { side, gap, bottom, insetTop = 24 } = spacing;
  const bodyBottom = H - bottom;
  const rest = count - 1;

  if (!rest) {
    const h = Math.min(bodyBottom, W / RATIO.min);
    const inner = { x: 0, y: (bodyBottom - h) / 2, w: W, h };
    const cover = { x: 0, y: 0, w: W, h: bodyBottom, cover: true, inner };
    return { slots: [cover], bodyBottom, height: H };
  }

  const innerW = W - side * 2;
  const rows = rest <= 3 ? [rest] : [Math.ceil(rest / 2), Math.floor(rest / 2)];
  const natural =
    rows.reduce(
      (sum, columns) => sum + (innerW - gap * (columns - 1)) / columns / camera,
      0,
    ) +
    gap * (rows.length - 1);
  const coverH = Math.min(
    W / RATIO.min,
    Math.max(W / 1.8, bodyBottom - insetTop - natural),
  );

  const insets = fitRows(
    rows,
    {
      x: side,
      y: coverH + insetTop,
      w: innerW,
      h: bodyBottom - coverH - insetTop,
    },
    { gap, min: RATIO.min, max: RATIO.max },
  );
  return {
    slots: [{ x: 0, y: 0, w: W, h: coverH, cover: true }, ...plain(insets)],
    bodyBottom,
    height: H,
  };
}

// Dua photostrip identik (2 × 6 inci) di satu lembar 4R, digunting di tengah.
// Foto rata atas; sisa ruang (sesi 1–2 foto) dilaporkan sebagai `free` untuk diisi desain.
function strip(count, camera, spacing) {
  const { top, side, gap, bottom } = spacing;
  const half = W / 2;
  const area = { y: top, w: half - side * 2, h: H - bottom - top };
  const slots = [];
  let blockH = 0;

  [0, 1].forEach((copy) => {
    const fit = fitRows(
      Array(count).fill(1),
      { ...area, x: copy * half + side },
      { gap, min: RATIO.min, max: RATIO.max, align: "top" },
    );
    blockH = fit.blockH;
    plain(fit).forEach((slot, index) => slots.push({ ...slot, index }));
  });

  const free = { y: top + blockH + gap, h: area.h - blockH - gap };
  return { slots, free, bodyBottom: H - bottom, height: H };
}

export const LAYOUTS = {
  auto,
  grid,
  feature,
  film,
  polaroid,
  collage,
  magazine,
  strip,
};
