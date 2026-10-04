/** @format */

// Palet DTC (sama dengan dtc-system.css), dipakai semua desain photocard.
export const C = {
  blue: "#0878ED",
  electric: "#009EF7",
  cyan: "#12C8F4",
  deep: "#054BAE",
  navy: "#07152B",
  ink: "#050A12",
  paper: "#F7F9FB",
  white: "#FFFFFF",
  grey: "#DCE3EA",
  muted: "#8D99A6",
  text: "#5B6776",
  signal: "#E5484D",
};

export const pad2 = (value) => String(value).padStart(2, "0");

export const mono = (size, color, extra = {}) => ({
  family: "mono",
  size,
  weight: 500,
  spacing: 2,
  color,
  ...extra,
});

// Judul dikecilkan otomatis supaya tidak pernah keluar kartu.
export function title(kit, value, x, y, maxWidth, options) {
  const size = kit.fit(value, maxWidth, options);
  kit.text(value, x, y, { ...options, size });
  return size;
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

// Baris info: label mono kecil di atas nilai display, dibagi rata sepanjang lebar.
export function specRow(kit, items, { x, y, width, label, value, divider }) {
  const cell = width / items.length;
  items.forEach(([name, text], index) => {
    const left = x + cell * index;
    if (divider && index) kit.line(left, y - 34, left, y + 58, divider, 1.5);
    const inset = divider ? 20 : 0;
    kit.text(name, left + inset, y, label);
    title(kit, text, left + inset, y + 50, cell - inset * 2 - 8, value);
  });
}
