/** @format */

export const themes = [
  {
    id: "ticket",
    name: "Tiket Masuk",
    subtitle: "Krem × Marun",
    mark: "TIKET",
    description:
      "Tiket festival, lengkap dengan sobekan, barcode, dan stempel.",
  },
  {
    id: "retro",
    name: "Koran Kampus",
    subtitle: "Hitam-Putih",
    mark: "Koran",
    description:
      "Halaman depan koran. Fotonya hitam-putih, ada judul beritanya.",
  },
  {
    id: "pop",
    name: "Komik Pop",
    subtitle: "Kuning × Merah",
    mark: "POP!",
    description: "Warna terang, garis tebal, dan tulisan JEPRET! ala komik.",
  },
  {
    id: "cyber",
    name: "Neon Malam",
    subtitle: "Ungu × Neon",
    mark: "NEON",
    description:
      "Lampu neon, matahari retro, dan tampilan kamera yang lagi merekam.",
  },
];

// Dipakai bersama oleh kolase (canvas) dan pratinjau, supaya isinya selalu sama.
export const NEWS_CAPTIONS = [
  "Pose pertama, masih agak malu-malu.",
  "Mulai berani bergaya.",
  "Sudah lupa kalau lagi difoto.",
  "Gaya andalan akhirnya keluar.",
  "Hampir ketawa, tapi berhasil ditahan.",
  "Penutup yang layak masuk halaman depan.",
];

export const POP_STICKERS = [
  "WOW!",
  "CEKREK!",
  "MANTAP!",
  "KEREN!",
  "SIP!",
  "GAS!",
];

export function getTheme(id) {
  return themes.find((theme) => theme.id === id) || themes[0];
}
