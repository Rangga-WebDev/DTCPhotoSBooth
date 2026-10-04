/** @format */

// Diukur langsung dari public/logo/logoDTC.jpeg (latar JPEG #F7F7F7).
export const LOGO = {
  src: "/logo/logoDTC.jpeg",
  width: 590,
  height: 423,
  background: "#F7F7F7",
  alt: "DTC 2026, Discovery Technology Creative",
};

// Area monogram DTC tanpa wordmark, plus sedikit ruang napas.
export const LOGO_MARK = { x: 136, y: 16, w: 362, h: 256 };

// Wordmark "DISCOVERY TECHNOLOGY CREATIVE" + baris "2026".
export const LOGO_WORDMARK = { x: 58, y: 288, w: 514, h: 84 };

// span = lebar kolom swatch di grid 12 / 8 kolom (halaman design system).
export const DTC_COLORS = [
  {
    name: "Soft White",
    token: "--dtc-paper",
    hex: "#F7F9FB",
    fg: "#050A12",
    role: "Latar utama, 55–65% layar",
    contrast: "Ink di atasnya 18.8 : 1",
    span: 6,
    spanMd: 8,
  },
  {
    name: "Ink",
    token: "--dtc-ink",
    hex: "#050A12",
    fg: "#F7F9FB",
    role: "Teks, garis tegas, tombol sekunder",
    contrast: "Paper di atasnya 18.8 : 1",
    span: 3,
    spanMd: 4,
  },
  {
    name: "Midnight Navy",
    token: "--dtc-navy",
    hex: "#07152B",
    fg: "#F7F9FB",
    role: "Section gelap, 20–25% layar",
    contrast: "Paper di atasnya 17.3 : 1",
    span: 3,
    spanMd: 4,
  },
  {
    name: "Primary Blue",
    token: "--dtc-blue",
    hex: "#0878ED",
    fg: "#FFFFFF",
    role: "Aksen brand & display besar",
    contrast: "Di paper 4.1 : 1, hanya teks ≥ 24px",
    span: 4,
    spanMd: 4,
  },
  {
    name: "Deep Blue",
    token: "--dtc-blue-deep",
    hex: "#054BAE",
    fg: "#FFFFFF",
    role: "Tombol utama, teks biru kecil",
    contrast: "Putih di atasnya 8.0 : 1",
    span: 4,
    spanMd: 4,
  },
  {
    name: "Electric Blue",
    token: "--dtc-blue-electric",
    hex: "#009EF7",
    fg: "#050A12",
    role: "Aksen di permukaan gelap",
    contrast: "Di navy 6.3 : 1",
    span: 2,
    spanMd: 2,
  },
  {
    name: "Cyan",
    token: "--dtc-cyan",
    hex: "#12C8F4",
    fg: "#050A12",
    role: "Sinyal & status, maks. 5%",
    contrast: "Di navy 9.2 : 1",
    span: 2,
    spanMd: 2,
  },
  {
    name: "Tech Grey",
    token: "--dtc-grey",
    hex: "#DCE3EA",
    fg: "#050A12",
    role: "Garis & bidang pemisah",
    contrast: "Dekoratif, bukan teks",
    span: 4,
    spanMd: 4,
  },
  {
    name: "Muted Grey",
    token: "--dtc-grey-muted",
    hex: "#8D99A6",
    fg: "#050A12",
    role: "Meta di permukaan gelap",
    contrast: "Di navy 6.3 : 1",
    span: 4,
    spanMd: 4,
  },
  {
    name: "Meta Grey",
    token: "--dtc-grey-text",
    hex: "#5B6776",
    fg: "#F7F9FB",
    role: "Meta kecil di permukaan terang",
    contrast: "Di paper 5.5 : 1",
    span: 4,
    spanMd: 8,
  },
];
