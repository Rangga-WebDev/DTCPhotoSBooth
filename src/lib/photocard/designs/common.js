/** @format */

import { COLORS, MARK_INK } from "../../../data/brand";

// Palet photocard: merah-hitam logo + material proyek (baja, beton, kertas gambar).
export const C = {
  red: COLORS.red,
  redStrong: COLORS.redStrong,
  redDeep: COLORS.redDeep,
  black: COLORS.black,
  ink: "#111113",
  charcoal: COLORS.charcoal,
  steel: "#5A5E66",
  steelLight: "#9AA0A8",
  concrete: "#A8A59F",
  paper: "#F4F2EE",
  white: "#FFFFFF",
  line: "#D6D3CC",
  text: "#55555C",
  muted: "#8C8C94",
  inkOnDark: MARK_INK.dark,
  inkOnLight: MARK_INK.light,
};

export const TITLE = "CIVIL IN ACTION";

export const pad2 = (value) => String(value).padStart(2, "0");

// Label kecil huruf kapital berjarak (Barlow Condensed).
export const label = (size, color, extra = {}) => ({
  family: "display",
  size,
  weight: 600,
  spacing: Math.round(size * 0.12),
  color,
  ...extra,
});

export const display = (size, color, extra = {}) => ({
  family: "display",
  size,
  weight: 800,
  color,
  ...extra,
});

// Judul dikecilkan otomatis supaya tidak pernah keluar kartu.
export function title(kit, value, x, y, maxWidth, options) {
  const size = kit.fit(value, maxWidth, { family: "display", weight: 800, ...options });
  kit.text(value, x, y, { family: "display", weight: 800, ...options, size });
  return size;
}

// Judul besar beberapa baris dengan ukuran sama (baris terlebar yang menentukan).
export function bigTitle(kit, { x, top, width, lines, colors, size = 220, gap = 16, align = "left" }) {
  const fitted = Math.min(
    ...lines.map((line) => kit.fit(line, width, display(size))),
  );
  const cap = fitted * 0.7;
  let baseline = top + cap;
  lines.forEach((line, index) => {
    kit.text(line, x, baseline, display(fitted, colors[index] ?? colors[0], { align }));
    if (index < lines.length - 1) baseline += cap + gap;
  });
  return { size: fitted, bottom: baseline };
}

// Semua foto sesuai slot: bingkai (polaroid/kolase), border, bayangan, sudut membulat.
export function drawPhotos(kit, images, layout, options = {}) {
  const {
    border = 0,
    borderColor = C.white,
    radius = 0,
    shadow,
    frameColor = C.white,
    filter = "",
    after,
  } = options;

  layout.slots.forEach((slot, index) => {
    const image = images[slot.index ?? index];
    if (!image) return;

    kit.within(slot, () => {
      const box =
        slot.frame ??
        (border
          ? {
              x: slot.x - border,
              y: slot.y - border,
              w: slot.w + border * 2,
              h: slot.h + border * 2,
            }
          : null);
      const color = slot.frame ? frameColor : borderColor;
      const r = radius ? radius + (slot.frame ? 4 : border) : 0;
      const paint = () =>
        box
          ? kit.roundRect(box.x, box.y, box.w, box.h, r, color)
          : kit.roundRect(slot.x, slot.y, slot.w, slot.h, radius, C.ink);

      if (shadow) kit.shadow(shadow.color, shadow.blur, shadow.y ?? 0, paint);
      else if (box) paint();
    });

    if (slot.inner) {
      // Sampul tunggal: foto yang sama di-blur jadi latar, foto tajam di tengah.
      const backdrop = `${filter} blur(40px) brightness(0.72)`.trim();
      kit.photo(image, slot, { radius, filter: backdrop, bleed: 120 });
      kit.photo(image, slot.inner, { filter });
    } else {
      kit.photo(image, slot, { radius, filter });
    }
    after?.(slot, index);
  });
}

// Baris info: label kecil di atas nilai besar, dibagi rata sepanjang lebar.
export function specRow(kit, items, { x, y, width, labelStyle, value, divider }) {
  const cell = width / items.length;
  items.forEach(([name, text], index) => {
    const left = x + cell * index;
    if (divider && index) kit.line(left, y - 34, left, y + 58, divider, 1.5);
    const inset = divider && index ? 20 : 0;
    kit.text(name, left + inset, y, labelStyle);
    title(kit, text, left + inset, y + 50, cell - inset - 16, value);
  });
}

// Batas atas & bawah blok foto (untuk ornamen di sekitarnya).
export function photoBounds(layout) {
  const slots = layout.slots;
  return {
    left: Math.min(...slots.map((slot) => slot.frame?.x ?? slot.x)),
    right: Math.max(...slots.map((slot) => (slot.frame?.x ?? slot.x) + (slot.frame?.w ?? slot.w))),
    top: Math.min(...slots.map((slot) => slot.frame?.y ?? slot.y)),
    bottom: Math.max(...slots.map((slot) => (slot.frame?.y ?? slot.y) + (slot.frame?.h ?? slot.h))),
  };
}
