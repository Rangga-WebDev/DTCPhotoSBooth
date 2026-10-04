/**
 * DTCBOOTH — alamat QR (local / public)
 *   local  = HP harus satu Wi-Fi dengan laptop booth (NEXT_PUBLIC_LOCAL_URL).
 *   public = lewat Cloudflare Tunnel, bisa dibuka dari mana saja (NEXT_PUBLIC_PUBLIC_URL).
 *
 * @format
 */

import "server-only";

import { randomUUID } from "node:crypto";

// Kunci dinamis: dibaca saat runtime, bukan di-inline saat build,
// jadi ganti URL tunnel cukup restart server (tanpa build ulang).
const readEnv = (key) => (process.env[key] ?? "").trim();

const LOOPBACK = /^(localhost|127(\.\d+){3}|0\.0\.0\.0|\[::1\])$/i;
const PRIVATE_IP =
  /^(10(\.\d+){3}|192\.168(\.\d+){2}|172\.(1[6-9]|2\d|3[01])(\.\d+){2}|169\.254(\.\d+){2})$/;
const PING_TIMEOUT_MS = 4000;
const CACHE_MS = 20000;

// Satu ID per proses server; globalThis supaya sama di semua bundle route.
export function getInstanceId() {
  globalThis.__dtcShareInstance ??= randomUUID();
  return globalThis.__dtcShareInstance;
}

export function getShareConfig() {
  return {
    mode:
      readEnv("NEXT_PUBLIC_DOWNLOAD_MODE") === "public" ? "public" : "local",
    publicUrl: readEnv("NEXT_PUBLIC_PUBLIC_URL"),
    localUrl:
      readEnv("NEXT_PUBLIC_LOCAL_URL") || readEnv("NEXT_PUBLIC_BOOTH_URL"),
  };
}

export function parseLocalOrigin(value) {
  if (!value) {
    throw new Error("NEXT_PUBLIC_LOCAL_URL belum diisi di .env.local.");
  }
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Isi NEXT_PUBLIC_LOCAL_URL tidak valid.");
  }
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error(
      "NEXT_PUBLIC_LOCAL_URL harus diawali http:// atau https://.",
    );
  }
  if (LOOPBACK.test(url.hostname)) {
    throw new Error(
      "NEXT_PUBLIC_LOCAL_URL masih localhost, jadi HP tidak bisa membukanya. Ganti dengan IPv4 laptop.",
    );
  }
  return url.origin;
}

export function parsePublicOrigin(value) {
  if (!value) {
    throw new Error("NEXT_PUBLIC_PUBLIC_URL belum diisi di .env.local.");
  }
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Isi NEXT_PUBLIC_PUBLIC_URL tidak valid.");
  }
  if (url.protocol !== "https:") {
    throw new Error("NEXT_PUBLIC_PUBLIC_URL harus diawali https://.");
  }
  if (LOOPBACK.test(url.hostname) || PRIVATE_IP.test(url.hostname)) {
    throw new Error(
      "NEXT_PUBLIC_PUBLIC_URL harus alamat publik, misalnya dari Cloudflare Tunnel.",
    );
  }
  return url.origin;
}

// Cek sungguhan: server memanggil dirinya sendiri lewat internet → Cloudflare → tunnel.
// Cocok hanya kalau yang menjawab adalah proses server ini (instance ID sama).
export async function checkPublicReachable(origin) {
  const cache = globalThis.__dtcShareReach;
  if (cache?.origin === origin && Date.now() - cache.at < CACHE_MS) {
    return cache.ok;
  }

  let ok = false;
  try {
    const response = await fetch(`${origin}/api/share/ping`, {
      cache: "no-store",
      signal: AbortSignal.timeout(PING_TIMEOUT_MS),
    });
    const data = await response.json();
    ok = response.ok && data.instance === getInstanceId();
  } catch {
    ok = false;
  }

  globalThis.__dtcShareReach = { origin, ok, at: Date.now() };
  return ok;
}

// Alamat yang dipakai QR saat ini. Mode public jatuh ke local kalau tunnel tidak menjawab.
export async function resolveShareTarget() {
  const { mode, publicUrl, localUrl } = getShareConfig();

  if (mode === "local") {
    return {
      mode: "local",
      origin: parseLocalOrigin(localUrl),
      fallback: false,
    };
  }

  const publicOrigin = parsePublicOrigin(publicUrl);
  if (await checkPublicReachable(publicOrigin)) {
    return { mode: "public", origin: publicOrigin, fallback: false };
  }

  let localOrigin;
  try {
    localOrigin = parseLocalOrigin(localUrl);
  } catch {
    throw new Error(
      "Link publik tidak bisa dihubungi dan NEXT_PUBLIC_LOCAL_URL belum siap. Cek internet dan Cloudflare Tunnel.",
    );
  }
  return { mode: "local", origin: localOrigin, fallback: true };
}
