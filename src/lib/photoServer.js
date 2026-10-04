/**
 * DTCBOOTH PHOTO SERVER
 *   Menyimpan dan membaca foto di laptop.
 *   Modul hanya untuk Next.js server.
 *
 * @format
 */

import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomInt } from "node:crypto";

// Folder khusus hasil photobooth.
// Jangan tempatkan foto pengunjung di folder public.
const STORAGE_DIR = path.join(process.cwd(), "storage", "photos");

// Maksimum satu hasil kolase: 15 MB.
export const MAX_PHOTO_BYTES = 15 * 1024 * 1024;

// Foto berlaku 24 jam.
export const PHOTO_TTL_MS = 24 * 60 * 60 * 1000;

// 20 karakter [0-9a-z] ≈ 103 bit acak: pendek untuk QR, tetap tidak bisa ditebak.
// Huruf kecil saja karena nama file di Windows tidak peka huruf besar/kecil.
const ID_ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";
const ID_LENGTH = 20;
const SHORT_ID = /^[0-9a-z]{20}$/;
const LEGACY_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function createPhotoId() {
  let id = "";
  for (let i = 0; i < ID_LENGTH; i++) {
    id += ID_ALPHABET[randomInt(ID_ALPHABET.length)];
  }
  return id;
}

export function isValidPhotoId(id) {
  return typeof id === "string" && (SHORT_ID.test(id) || LEGACY_ID.test(id));
}

const isValidId = isValidPhotoId;

// Pastikan direktori tersedia
async function ensureStorage() {
  await fs.mkdir(STORAGE_DIR, {
    recursive: true,
  });
}

// Simpan hasil kolase JPEG
export async function saveSharedPhoto(buffer) {
  if (!Buffer.isBuffer(buffer)) {
    throw new Error("Foto harus berupa Buffer.");
  }

  if (buffer.length === 0 || buffer.length > MAX_PHOTO_BYTES) {
    throw new Error("Ukuran foto tidak valid atau terlalu besar.");
  }

  // Periksa JPEG magic bytes.
  const isJPEG = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;

  if (!isJPEG) {
    throw new Error("Hanya file JPEG yang diperbolehkan.");
  }

  await ensureStorage();

  const id = createPhotoId();
  const filename = `${id}.jpg`;

  await fs.writeFile(path.join(STORAGE_DIR, filename), buffer, { flag: "wx" });

  return {
    id,
    filename,
    expiresAt: Date.now() + PHOTO_TTL_MS,
  };
}

// Baca foto menggunakan ID
export async function getSharedPhoto(id) {
  if (!isValidId(id)) {
    return null;
  }

  await ensureStorage();

  const filename = `${id}.jpg`;
  const filepath = path.join(STORAGE_DIR, filename);

  try {
    const stats = await fs.stat(filepath);

    // Hasil foto otomatis dianggap kedaluwarsa
    // setelah 24 jam.
    const expiresAt = stats.birthtimeMs + PHOTO_TTL_MS;

    if (Date.now() > expiresAt) {
      return null;
    }

    const buffer = await fs.readFile(filepath);

    return {
      buffer,
      filename: `DTCBooth-${id.slice(0, 8)}.jpg`,
      expiresAt,
    };
  } catch (error) {
    if (error.code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

// Ukuran piksel dari marker SOF di header JPEG, tanpa membaca seluruh file.
async function readJpegSize(filepath) {
  const handle = await fs.open(filepath, "r");
  try {
    const { buffer, bytesRead } = await handle.read({
      buffer: Buffer.alloc(65536),
      position: 0,
    });
    let offset = 2;
    while (offset + 9 < bytesRead) {
      if (buffer[offset] !== 0xff) return null;
      const marker = buffer[offset + 1];
      const length = buffer.readUInt16BE(offset + 2);
      const isSof =
        marker >= 0xc0 &&
        marker <= 0xcf &&
        ![0xc4, 0xc8, 0xcc].includes(marker);
      if (isSof) {
        return {
          height: buffer.readUInt16BE(offset + 5),
          width: buffer.readUInt16BE(offset + 7),
        };
      }
      offset += 2 + length;
    }
    return null;
  } finally {
    await handle.close();
  }
}

// Status link untuk halaman download: ready | expired | missing.
export async function getSharedPhotoInfo(id) {
  if (!isValidId(id)) {
    return { status: "missing" };
  }

  const filepath = path.join(STORAGE_DIR, `${id}.jpg`);

  try {
    const stats = await fs.stat(filepath);
    const createdAt = stats.birthtimeMs;
    const expiresAt = createdAt + PHOTO_TTL_MS;

    if (Date.now() > expiresAt) {
      return { status: "expired", createdAt, expiresAt };
    }

    return {
      status: "ready",
      createdAt,
      expiresAt,
      bytes: stats.size,
      size: await readJpegSize(filepath).catch(() => null),
      filename: `DTCBooth-${id.slice(0, 8)}.jpg`,
    };
  } catch (error) {
    if (error.code === "ENOENT") {
      return { status: "missing" };
    }

    throw error;
  }
}

// Hapus foto yang sudah kedaluwarsa.
// Panggil dari pekerjaan maintenance server.
export async function cleanupExpiredPhotos() {
  await ensureStorage();

  const files = await fs.readdir(STORAGE_DIR, { withFileTypes: true });

  let deleted = 0;

  for (const file of files) {
    if (!file.isFile() || !file.name.endsWith(".jpg")) {
      continue;
    }

    const filepath = path.join(STORAGE_DIR, file.name);

    const stats = await fs.stat(filepath);

    const expiresAt = stats.birthtimeMs + PHOTO_TTL_MS;

    if (Date.now() > expiresAt) {
      await fs.unlink(filepath);
      deleted++;
    }
  }

  return deleted;
}
