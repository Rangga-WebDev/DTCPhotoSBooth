/** @format */

// Identitas CIA (Civil In Action). Warna diambil langsung dari piksel logo resmi.
export const BRAND = {
  short: "CIA",
  name: "Civil In Action",
  product: "CIA Photobooth",
  field: "Teknik Sipil",
  tagline: "Photobooth AI Teknik Sipil",
};

export const COLORS = {
  red: "#F00C1C", // permukaan depan huruf C dan A
  redStrong: "#E00B1A", // latar tombol, teks putih 5 : 1
  redDeep: "#8E0A12", // sisi ekstrusi yang gelap
  black: "#000000", // latar logo
  charcoal: "#2C2C2E", // huruf i
};

// Logo 3D resmi, latar hitam murni (#000) supaya menyatu dengan halaman gelap.
export const LOGO = {
  src: "/logo/cia-logo.jpg",
  width: 473,
  height: 542,
  alt: "Logo CIA, Civil In Action",
};

// Versi datar logo (viewBox 0 0 388 455) untuk ukuran kecil, photocard, dan latar terang.
// red = heksagon "C" + huruf "A"; ink = huruf "i" (badan + titik).
export const MARK = {
  width: 388,
  height: 455,
  red: "M349 108.9L184 0L0 121.4V335.4L180 454.2V400.3L45 311.2V145.7L184 53.9L324.2 146.5ZM252 136L182 263.4V345H188.5L252 229.4L293.2 304.5H219.9L197.6 345H315.5L336.6 383.5H388Z",
  ink: "M124 190L174 157V346L238 388.2V421.2L188 454.2V388.2L124 346ZM124 130L174 97V142L124 175Z",
};

// Warna huruf "i" di tiap latar: di latar gelap dibuat sedikit lebih terang supaya tetap terbaca.
export const MARK_INK = {
  dark: "#4A4A50",
  light: "#1C1C1E",
};
