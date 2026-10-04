/** @format */

// Filter hanya mengubah foto, bukan grafis kartu.
// css = ctx.filter; tint = lapisan warna dengan blend mode; fade = hitam diangkat; grain = butiran.
export const FILTERS = [
  {
    id: "original",
    name: "Original",
    note: "Warna asli dari kamera, tanpa diubah.",
    css: "",
  },
  {
    id: "soft",
    name: "Soft",
    note: "Lembut dan sedikit hangat, bayangan lebih ringan.",
    css: "brightness(1.06) contrast(0.9) saturate(0.92)",
    tint: { color: "#ffd2b8", alpha: 0.28, mode: "soft-light" },
  },
  {
    id: "clean",
    name: "Clean",
    note: "Terang dan tajam, warnanya tetap natural.",
    css: "brightness(1.08) contrast(1.08) saturate(1.06)",
  },
  {
    id: "cool",
    name: "Cool",
    note: "Nuansa biru dingin, senada dengan warna DTC.",
    css: "contrast(1.04) saturate(0.88)",
    tint: { color: "#0878ed", alpha: 0.3, mode: "soft-light" },
  },
  {
    id: "film",
    name: "Film",
    note: "Pudar hangat dengan butiran, ala rol film.",
    css: "contrast(0.9) saturate(0.8) sepia(0.22) brightness(1.03)",
    fade: "rgb(38, 30, 24)",
    grain: 0.1,
  },
  {
    id: "bw",
    name: "B&W",
    note: "Hitam putih dengan kontras tegas.",
    css: "grayscale(1) contrast(1.16) brightness(1.03)",
  },
];

export const DEFAULT_FILTER = "original";

export function getFilter(id) {
  return FILTERS.find((filter) => filter.id === id) ?? FILTERS[0];
}
