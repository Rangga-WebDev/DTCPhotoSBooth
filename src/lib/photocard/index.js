/** @format */

import { LAYOUTS, CARD_DPI, CARD_SIZE, CARD_WIDTH } from "./layouts";
import { createKit, getStamp, loadFonts, loadLogo, loadPhotos } from "./kit";
import { getFilter } from "./filters";
import signature from "./designs/signature";
import cuteCool from "./designs/cute-cool";
import people from "./designs/people";
import himpunan from "./designs/himpunan";

export const CATEGORIES = [
  { id: "signature", name: "DTC Signature", note: "Identitas resmi DTC 2026" },
  { id: "cute", name: "Cute", note: "Lembut, lucu, penuh stiker" },
  { id: "cool", name: "Cool", note: "Gelap, tegas, ala editorial" },
  { id: "couple", name: "Couple", note: "Buat berdua" },
  { id: "friendship", name: "Friendship", note: "Buat bestie dan geng" },
  { id: "group", name: "Group", note: "Rombongan besar" },
  { id: "himpunan", name: "Himpunan", note: "HMS · HME · HMA · HMIF · HMPWK" },
];

const DESIGNS = [...signature, ...cuteCool, ...people, ...himpunan];
const BY_ID = new Map(DESIGNS.map((design) => [design.id, design]));

export const DEFAULT_DESIGN = "sig-poster";

export const PHOTOCARDS = DESIGNS.map(
  ({ id, name, category, note, layout }) => ({
    id,
    name,
    category,
    note,
    layout,
  }),
);

export function getPhotocard(id) {
  const design = BY_ID.get(id) ?? BY_ID.get(DEFAULT_DESIGN);
  return PHOTOCARDS.find((card) => card.id === design.id);
}

export function preparePhotocardAssets() {
  return Promise.all([loadFonts(), loadLogo().catch(() => null)]);
}

// images = ImageBitmap/Image hasil loadPhotos; scale < 1 untuk thumbnail cepat.
export async function renderPhotocard(images, designId, options = {}) {
  if (!images?.length || images.length > 6) {
    throw new Error("Jumlah foto harus antara 1 sampai 6.");
  }

  const design = BY_ID.get(designId) ?? BY_ID.get(DEFAULT_DESIGN);
  const [, logo] = await preparePhotocardAssets();
  const { scale = 1, capturedAt, sessionNumber, filter, canvas } = options;

  const ratio = images[0].width / images[0].height || 16 / 9;
  const layout = LAYOUTS[design.layout](
    images.length,
    ratio,
    design.spacing(images.length),
  );

  const target = canvas ?? document.createElement("canvas");
  target.width = Math.round(CARD_WIDTH * scale);
  target.height = Math.round(layout.height * scale);

  const ctx = target.getContext("2d");
  if (!ctx) throw new Error("Browser ini tidak bisa membuat photocard.");
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.imageSmoothingQuality = "high";

  const kit = createKit(ctx, {
    width: CARD_WIDTH,
    height: layout.height,
    stamp: getStamp(capturedAt, sessionNumber),
    logo,
    tone: getFilter(filter),
  });
  design.draw(kit, images, layout);

  return target;
}

// Contoh filter kecil: satu foto, cover-crop, tanpa grafis kartu.
export function renderFilterSwatch(image, filterId, canvas, { width, height }) {
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  ctx.imageSmoothingQuality = "high";
  const kit = createKit(ctx, {
    width,
    height,
    stamp: getStamp(0),
    tone: getFilter(filterId),
  });
  kit.photo(image, { x: 0, y: 0, w: width, h: height });
  return canvas;
}

// Pengganti composePhotos lama: sumber = URL/Blob, hasil = canvas 4R 1200 × 1800 px.
export async function composePhotocard(sources, designId, options = {}) {
  const images = await loadPhotos(sources);
  try {
    return await renderPhotocard(images, designId, options);
  } finally {
    images.forEach((image) => image.close?.());
  }
}

// Segmen JFIF APP0 bertanda 300 dpi: aplikasi cetak membaca 1200 × 1800 px sebagai 4 × 6 inci.
const DPI_HIGH = CARD_DPI >> 8;
const DPI_LOW = CARD_DPI & 0xff;
const JFIF_300 = [
  0xff,
  0xe0,
  0x00,
  0x10,
  0x4a,
  0x46,
  0x49,
  0x46,
  0x00,
  0x01,
  0x01,
  0x01,
  DPI_HIGH,
  DPI_LOW,
  DPI_HIGH,
  DPI_LOW,
  0x00,
  0x00,
];

function withPrintDpi(bytes) {
  const hasJfif =
    bytes[2] === 0xff &&
    bytes[3] === 0xe0 &&
    String.fromCharCode(...bytes.subarray(6, 11)) === "JFIF\0";
  if (hasJfif) {
    bytes.set(JFIF_300.slice(11, 16), 13);
    return bytes;
  }
  const tagged = new Uint8Array(bytes.length + JFIF_300.length);
  tagged.set(bytes.subarray(0, 2));
  tagged.set(JFIF_300, 2);
  tagged.set(bytes.subarray(2), 2 + JFIF_300.length);
  return tagged;
}

export async function canvasToJpeg(canvas, quality = 0.95) {
  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (result) =>
        result ? resolve(result) : reject(new Error("File JPG gagal dibuat.")),
      "image/jpeg",
      quality,
    );
  });
  const bytes = withPrintDpi(new Uint8Array(await blob.arrayBuffer()));
  return new Blob([bytes], { type: "image/jpeg" });
}

export async function downloadCanvas(canvas, filename) {
  const url = URL.createObjectURL(await canvasToJpeg(canvas));
  const link = document.createElement("a");
  link.download = filename;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

let printFrame = null;

// Dialog cetak browser dengan halaman 4 × 6 inci tanpa margin, foto pas satu lembar.
export async function printPhotocard(canvas) {
  printFrame?.remove();
  const url = URL.createObjectURL(await canvasToJpeg(canvas));
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText =
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
  frame.srcdoc = `<!doctype html><title>DTCBooth ${CARD_SIZE.name}</title><style>@page{size:4in 6in;margin:0}html,body{margin:0}img{display:block;width:4in;height:6in}</style><img src="${url}" alt="">`;
  printFrame = frame;

  const cleanup = () => {
    frame.remove();
    URL.revokeObjectURL(url);
    if (printFrame === frame) printFrame = null;
  };

  try {
    await new Promise((resolve, reject) => {
      frame.onload = resolve;
      frame.onerror = () => reject(new Error("Halaman cetak gagal dibuat."));
      document.body.appendChild(frame);
    });
    const view = frame.contentWindow;
    await view.document.querySelector("img").decode();
    view.addEventListener("afterprint", cleanup, { once: true });
    view.focus();
    view.print();
  } catch (error) {
    cleanup();
    throw error;
  }
}

export { CARD_SIZE, loadPhotos };
export { FILTERS, DEFAULT_FILTER, getFilter } from "./filters";
