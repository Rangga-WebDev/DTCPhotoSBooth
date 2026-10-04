/** @format */

// Jumlah foto per sesi; susunan di kartu 4R dipilih otomatis oleh lib/photocard/layouts.js.
export const FORMATS = [
  { count: 1, name: "Hero", note: "Satu foto besar" },
  { count: 2, name: "Duo", note: "Dua foto bertumpuk" },
  { count: 3, name: "Strip", note: "Photostrip klasik" },
  { count: 4, name: "Grid", note: "Kotak 2 × 2" },
  { count: 5, name: "Feature", note: "1 besar + 4 kecil" },
  { count: 6, name: "Contact", note: "Contact sheet 2 × 3" },
];

export function parsePhotoCount(value) {
  const count = Number(value);
  return Number.isInteger(count) && count >= 1 && count <= 6 ? count : 3;
}

export function getFormat(count) {
  return FORMATS.find((format) => format.count === count) ?? FORMATS[2];
}

// Tahan ~1 dtk + hitung mundur 3 dtk + turunkan tangan, plus waktu siap-siap.
export function estimateSeconds(count) {
  return Math.round((count * 6 + 10) / 5) * 5;
}

export function pad2(value) {
  return String(value).padStart(2, "0");
}
