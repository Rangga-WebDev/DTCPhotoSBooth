/**
 * Kunci upload booth. Kalau BOOTH_ACCESS_KEY diisi, hanya browser booth yang menyimpan
 * kunci itu (header x-booth-key) yang boleh mengunggah foto.
 * Website publik (mode site) WAJIB punya kunci: tanpa kunci, upload ditolak (fail closed)
 * supaya storage tidak bisa dipakai siapa saja di internet.
 *
 * @format
 */

import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";

import { getShareMode, readEnv } from "./shareMode";

const HEADER = "x-booth-key";
const digest = (value) => createHash("sha256").update(value).digest();

// { required, configured, provided, valid }
export function boothKeyStatus(request) {
  const expected = readEnv("BOOTH_ACCESS_KEY");
  const provided = (request.headers.get(HEADER) ?? "").trim();

  if (!expected) {
    const publicSite = getShareMode() === "site";
    return {
      required: publicSite,
      configured: false,
      provided: Boolean(provided),
      valid: !publicSite,
    };
  }

  return {
    required: true,
    configured: true,
    provided: Boolean(provided),
    valid: Boolean(provided) && timingSafeEqual(digest(provided), digest(expected)),
  };
}
