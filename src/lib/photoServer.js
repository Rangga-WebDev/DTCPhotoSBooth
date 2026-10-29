/**
 * CIA PHOTOBOOTH — penyimpanan foto hasil (untuk QR)
 *   local = folder storage/photos di laptop booth (next start).
 *   blob  = Vercel Blob, wajib untuk website yang di-deploy (filesystem serverless tidak permanen).
 *   Driver dipilih otomatis: ada BLOB_READ_WRITE_TOKEN → blob; selain itu local.
 *   Paksa dengan PHOTO_STORAGE=local|blob.
 *
 * @format
 */

import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomInt } from "node:crypto";

import { readEnv } from "./shareMode";

// Jangan taruh foto pengunjung di folder public.
const STORAGE_DIR = path.join(process.cwd(), "storage", "photos");
const BLOB_PREFIX = "cia-photobooth/photos/";

// Satu photocard 4R ± 0,5–1,5 MB; Vercel Functions membatasi body ± 4,5 MB.
export const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
export const PHOTO_TTL_MS = 24 * 60 * 60 * 1000;

// 20 karakter [0-9a-z] ≈ 103 bit acak: pendek untuk QR, tetap tidak bisa ditebak.
// Huruf kecil saja karena nama file di Windows tidak peka huruf besar/kecil.
const ID_ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";
const ID_LENGTH = 20;
const SHORT_ID = /^[0-9a-z]{20}$/;
const LEGACY_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function createPhotoId() {
  let id = "";
  for (let i = 0; i < ID_LENGTH; i++) id += ID_ALPHABET[randomInt(ID_ALPHABET.length)];
  return id;
}

export function isValidPhotoId(id) {
  return typeof id === "string" && (SHORT_ID.test(id) || LEGACY_ID.test(id));
}

export const photoFilename = (id) => `CIA-Photobooth-${id.slice(0, 8)}.jpg`;

const hasBlobCredentials = () =>
  Boolean(readEnv("BLOB_READ_WRITE_TOKEN") || readEnv("BLOB_STORE_ID"));

export function getStorageDriver() {
  const forced = readEnv("PHOTO_STORAGE").toLowerCase();
  if (forced === "local" || forced === "blob") return forced;
  return hasBlobCredentials() ? "blob" : "local";
}

export function getStorageStatus() {
  const driver = getStorageDriver();
  if (driver === "blob" && !hasBlobCredentials()) {
    return { driver, ready: false, error: "BLOB_READ_WRITE_TOKEN belum diisi." };
  }
  if (driver === "local" && readEnv("VERCEL")) {
    return {
      driver,
      ready: false,
      error: "Di Vercel foto harus disimpan di Vercel Blob. Hubungkan Blob store ke project ini.",
    };
  }
  return { driver, ready: true, error: null };
}

function isJpeg(buffer) {
  return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
}

/* ---------- local ---------- */

async function ensureStorage() {
  await fs.mkdir(STORAGE_DIR, { recursive: true });
}

const localPath = (id) => path.join(STORAGE_DIR, `${id}.jpg`);
// birthtime tidak selalu ada (sebagian filesystem Linux); mtime sebagai cadangan.
const createdOf = (stats) => stats.birthtimeMs || stats.mtimeMs;

// Ukuran piksel dari marker SOF di header JPEG, tanpa membaca seluruh file.
function jpegSize(buffer) {
  let offset = 2;
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) return null;
    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
    }
    offset += 2 + length;
  }
  return null;
}

async function readLocalSize(filepath) {
  const handle = await fs.open(filepath, "r");
  try {
    const { buffer, bytesRead } = await handle.read({
      buffer: Buffer.alloc(65536),
      position: 0,
    });
    return jpegSize(buffer.subarray(0, bytesRead));
  } finally {
    await handle.close();
  }
}

/* ---------- Vercel Blob ---------- */

// Akses store Blob ditentukan saat store dibuat (private/public). Default private;
// kalau ternyata store-nya public (atau sebaliknya), upload dicoba ulang dengan mode lain.
let learnedAccess = null;

const configuredAccess = () =>
  learnedAccess ?? (readEnv("BLOB_ACCESS").toLowerCase() === "public" ? "public" : "private");

async function withAccess(run) {
  const first = configuredAccess();
  try {
    return await run(first);
  } catch (error) {
    if (!/access/i.test(String(error?.message ?? ""))) throw error;
    const second = first === "private" ? "public" : "private";
    const result = await run(second);
    learnedAccess = second;
    return result;
  }
}

// URL Blob: https://<store>.<private|public>.blob.vercel-storage.com/<pathname>.
// Akses untuk membaca diambil dari URL hasil head(), jadi tidak bergantung tebakan per instance.
function accessOf(url) {
  const label = new URL(url).hostname.split(".")[1];
  return label === "private" || label === "public" ? label : configuredAccess();
}

const blobPath = (id) => `${BLOB_PREFIX}${id}.jpg`;

async function headBlob(id) {
  const { head, BlobNotFoundError } = await import("@vercel/blob");
  try {
    return await head(blobPath(id));
  } catch (error) {
    if (error instanceof BlobNotFoundError) return null;
    throw error;
  }
}

/* ---------- API ---------- */

export async function saveSharedPhoto(buffer) {
  if (!Buffer.isBuffer(buffer)) throw new Error("Foto harus berupa Buffer.");
  if (buffer.length === 0 || buffer.length > MAX_PHOTO_BYTES) {
    throw new Error("Ukuran foto tidak valid atau terlalu besar.");
  }
  if (!isJpeg(buffer)) throw new Error("Hanya file JPEG yang diperbolehkan.");

  const id = createPhotoId();

  if (getStorageDriver() === "blob") {
    const { put } = await import("@vercel/blob");
    await withAccess((access) =>
      put(blobPath(id), buffer, {
        access,
        contentType: "image/jpeg",
        addRandomSuffix: false,
        cacheControlMaxAge: 60,
      }),
    );
  } else {
    await ensureStorage();
    await fs.writeFile(localPath(id), buffer, { flag: "wx" });
  }

  return { id, expiresAt: Date.now() + PHOTO_TTL_MS };
}

// Isi foto untuk diunduh: { body (Buffer | ReadableStream), size, filename, expiresAt } atau null.
export async function getSharedPhoto(id) {
  if (!isValidPhotoId(id)) return null;

  if (getStorageDriver() === "blob") {
    const meta = await headBlob(id);
    if (!meta) return null;
    const expiresAt = new Date(meta.uploadedAt).getTime() + PHOTO_TTL_MS;
    if (Date.now() > expiresAt) return null;
    const { get } = await import("@vercel/blob");
    const result = await get(meta.url, { access: accessOf(meta.url) });
    if (!result || result.statusCode !== 200) return null;
    return {
      body: result.stream,
      size: result.blob.size ?? meta.size,
      filename: photoFilename(id),
      expiresAt,
    };
  }

  try {
    const stats = await fs.stat(localPath(id));
    const expiresAt = createdOf(stats) + PHOTO_TTL_MS;
    if (Date.now() > expiresAt) return null;
    const body = await fs.readFile(localPath(id));
    return { body, size: body.length, filename: photoFilename(id), expiresAt };
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

// Status link untuk halaman download: ready | expired | missing.
export async function getSharedPhotoInfo(id) {
  if (!isValidPhotoId(id)) return { status: "missing" };

  if (getStorageDriver() === "blob") {
    const meta = await headBlob(id);
    if (!meta) return { status: "missing" };
    const createdAt = new Date(meta.uploadedAt).getTime();
    const expiresAt = createdAt + PHOTO_TTL_MS;
    if (Date.now() > expiresAt) return { status: "expired", createdAt, expiresAt };
    return {
      status: "ready",
      createdAt,
      expiresAt,
      bytes: meta.size,
      size: null,
      filename: photoFilename(id),
    };
  }

  try {
    const filepath = localPath(id);
    const stats = await fs.stat(filepath);
    const createdAt = createdOf(stats);
    const expiresAt = createdAt + PHOTO_TTL_MS;
    if (Date.now() > expiresAt) return { status: "expired", createdAt, expiresAt };
    return {
      status: "ready",
      createdAt,
      expiresAt,
      bytes: stats.size,
      size: await readLocalSize(filepath).catch(() => null),
      filename: photoFilename(id),
    };
  } catch (error) {
    if (error.code === "ENOENT") return { status: "missing" };
    throw error;
  }
}

// Hapus foto yang sudah kedaluwarsa (dipanggil cron /api/cleanup atau skrip operator).
export async function cleanupExpiredPhotos() {
  const now = Date.now();
  let deleted = 0;

  if (getStorageDriver() === "blob") {
    const { list, del } = await import("@vercel/blob");
    let cursor;
    do {
      const page = await list({ prefix: BLOB_PREFIX, cursor, limit: 1000 });
      const expired = page.blobs
        .filter((blob) => now - new Date(blob.uploadedAt).getTime() > PHOTO_TTL_MS)
        .map((blob) => blob.url);
      if (expired.length) {
        await del(expired);
        deleted += expired.length;
      }
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);
    return deleted;
  }

  await ensureStorage();
  const files = await fs.readdir(STORAGE_DIR, { withFileTypes: true });
  for (const file of files) {
    if (!file.isFile() || !file.name.endsWith(".jpg")) continue;
    if (!isValidPhotoId(file.name.slice(0, -4))) continue;
    const filepath = path.join(STORAGE_DIR, file.name);
    const stats = await fs.stat(filepath);
    if (now - createdOf(stats) > PHOTO_TTL_MS) {
      await fs.unlink(filepath);
      deleted += 1;
    }
  }
  return deleted;
}
