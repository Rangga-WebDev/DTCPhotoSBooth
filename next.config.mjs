/** @format */

import { readFileSync } from "node:fs";

// Versi MediaPipe untuk cadangan CDN (dipakai kalau aset lokal public/mediapipe belum ada).
const { version: mediapipeVersion } = JSON.parse(
  readFileSync(
    new URL("./node_modules/@mediapipe/tasks-vision/package.json", import.meta.url),
    "utf8",
  ),
);

// Host dari alamat QR (Wi-Fi & tunnel) boleh memuat aset dev server;
// tanpa ini halaman download yang dibuka dari HP tidak ter-hidrasi saat `next dev`.
function hostOf(value) {
  try {
    return value ? new URL(value).hostname : null;
  } catch {
    return null;
  }
}

const devOrigins = [
  process.env.NEXT_PUBLIC_LOCAL_URL,
  process.env.NEXT_PUBLIC_BOOTH_URL,
  process.env.NEXT_PUBLIC_PUBLIC_URL,
  process.env.NEXT_PUBLIC_SITE_URL,
]
  .map(hostOf)
  .filter(Boolean);

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: [...new Set(devOrigins)],
  env: { NEXT_PUBLIC_MEDIAPIPE_VERSION: mediapipeVersion },
  poweredByHeader: false,
};

export default nextConfig;
