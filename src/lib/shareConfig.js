/**
 * CIA PHOTOBOOTH — alamat QR
 *   local  = HP harus satu Wi-Fi dengan laptop booth (NEXT_PUBLIC_LOCAL_URL).
 *   public = laptop booth + tunnel HTTPS (NEXT_PUBLIC_PUBLIC_URL), mis. Cloudflare Tunnel.
 *            Server memanggil dirinya lewat tunnel; kalau gagal, QR jatuh ke Wi-Fi lokal.
 *   site   = website di-deploy (Vercel, dsb.): QR memakai NEXT_PUBLIC_SITE_URL atau
 *            domain tempat booth sedang dibuka. Bisa dibuka dari mana saja.
 *
 * @format
 */

import "server-only";

import { randomUUID } from "node:crypto";

import { getShareMode, readEnv } from "./shareMode";

const LOOPBACK = /^(localhost|127(\.\d+){3}|0\.0\.0\.0|\[::1\])$/i;
const PRIVATE_IP =
  /^(10(\.\d+){3}|192\.168(\.\d+){2}|172\.(1[6-9]|2\d|3[01])(\.\d+){2}|169\.254(\.\d+){2})$/;
const PING_TIMEOUT_MS = 4000;
const CACHE_MS = 20000;

// Satu ID per proses server; globalThis supaya sama di semua bundle route.
export function getInstanceId() {
  globalThis.__ciaShareInstance ??= randomUUID();
  return globalThis.__ciaShareInstance;
}

export function getShareConfig() {
  return {
    mode: getShareMode(),
    publicUrl: readEnv("NEXT_PUBLIC_PUBLIC_URL"),
    localUrl: readEnv("NEXT_PUBLIC_LOCAL_URL") || readEnv("NEXT_PUBLIC_BOOTH_URL"),
    siteUrl: readEnv("NEXT_PUBLIC_SITE_URL"),
  };
}

function toUrl(value, name) {
  if (!value) throw new Error(`${name} belum diisi.`);
  try {
    return new URL(value);
  } catch {
    throw new Error(`Isi ${name} tidak valid.`);
  }
}

export function parseLocalOrigin(value) {
  const url = toUrl(value, "NEXT_PUBLIC_LOCAL_URL");
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("NEXT_PUBLIC_LOCAL_URL harus diawali http:// atau https://.");
  }
  if (LOOPBACK.test(url.hostname)) {
    throw new Error(
      "NEXT_PUBLIC_LOCAL_URL masih localhost, jadi HP tidak bisa membukanya. Ganti dengan IPv4 laptop.",
    );
  }
  return url.origin;
}

export function parsePublicOrigin(value, name = "NEXT_PUBLIC_PUBLIC_URL") {
  const url = toUrl(value, name);
  if (url.protocol !== "https:") throw new Error(`${name} harus diawali https://.`);
  if (LOOPBACK.test(url.hostname) || PRIVATE_IP.test(url.hostname)) {
    throw new Error(`${name} harus alamat publik, bukan localhost atau IP lokal.`);
  }
  return url.origin;
}

// Origin yang sedang dipakai browser booth (di balik proxy Vercel/Cloudflare).
export function requestOrigin(request) {
  const headers = request.headers;
  const fallback = new URL(request.url);
  const host = (headers.get("x-forwarded-host") ?? headers.get("host") ?? "")
    .split(",")[0]
    .trim();
  const proto = (headers.get("x-forwarded-proto") ?? fallback.protocol.replace(":", ""))
    .split(",")[0]
    .trim();
  return host ? `${proto}://${host}` : fallback.origin;
}

// Mode site: alamat eksplisit > domain yang sedang dibuka > domain produksi Vercel.
function resolveSiteOrigin(request) {
  const { siteUrl } = getShareConfig();
  if (siteUrl) return parsePublicOrigin(siteUrl, "NEXT_PUBLIC_SITE_URL");

  let requestError = null;
  if (request) {
    try {
      return parsePublicOrigin(requestOrigin(request), "Alamat website");
    } catch (error) {
      requestError = error;
    }
  }

  const production = readEnv("VERCEL_PROJECT_PRODUCTION_URL");
  if (production) return parsePublicOrigin(`https://${production}`, "Domain Vercel");

  throw new Error(
    requestError
      ? "Booth dibuka lewat localhost/IP lokal. Buka lewat domain website, atau isi NEXT_PUBLIC_SITE_URL."
      : "NEXT_PUBLIC_SITE_URL belum diisi.",
  );
}

// Cek sungguhan: server memanggil dirinya sendiri lewat internet → tunnel.
// Cocok hanya kalau yang menjawab adalah proses server ini (instance ID sama).
export async function checkPublicReachable(origin) {
  const cache = globalThis.__ciaShareReach;
  if (cache?.origin === origin && Date.now() - cache.at < CACHE_MS) return cache.ok;

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

  globalThis.__ciaShareReach = { origin, ok, at: Date.now() };
  return ok;
}

// Alamat yang dipakai QR saat ini.
export async function resolveShareTarget(request) {
  const { mode, publicUrl, localUrl } = getShareConfig();

  if (mode === "site") {
    return { mode: "site", origin: resolveSiteOrigin(request), fallback: false };
  }
  if (mode === "local") {
    return { mode: "local", origin: parseLocalOrigin(localUrl), fallback: false };
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
      "Link publik tidak bisa dihubungi dan NEXT_PUBLIC_LOCAL_URL belum siap. Cek internet dan tunnel.",
    );
  }
  return { mode: "local", origin: localOrigin, fallback: true };
}

function attempt(parse, value) {
  try {
    return { origin: parse(value), error: null };
  } catch (error) {
    return { origin: null, error: error.message };
  }
}

// Ringkasan untuk panel operator dan skrip preflight.
export async function getShareStatus(request) {
  const { mode, publicUrl, localUrl } = getShareConfig();
  const local = attempt(parseLocalOrigin, localUrl);
  const pub =
    mode === "public" ? attempt(parsePublicOrigin, publicUrl) : { origin: null, error: null };
  const reachable = pub.origin ? await checkPublicReachable(pub.origin) : null;

  let target = null;
  let error = null;
  try {
    target = await resolveShareTarget(request);
  } catch (resolveError) {
    error = resolveError.message;
  }

  return {
    mode,
    active: target?.mode ?? null,
    origin: target?.origin ?? null,
    fallback: target?.fallback ?? false,
    error,
    local,
    public: { ...pub, reachable },
  };
}
