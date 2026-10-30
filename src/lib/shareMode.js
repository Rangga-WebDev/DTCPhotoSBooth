/**
 * Mode alamat QR (dipakai server & proxy):
 *   local  = HP satu Wi-Fi dengan laptop booth (NEXT_PUBLIC_LOCAL_URL)
 *   public = laptop booth + tunnel HTTPS (NEXT_PUBLIC_PUBLIC_URL), dicek sungguhan
 *   site   = website di-deploy (Vercel, dsb.); QR memakai domain website itu sendiri
 * Tanpa NEXT_PUBLIC_DOWNLOAD_MODE: "site" di Vercel, "local" di laptop.
 *
 * @format
 */

const MODES = new Set(["local", "public", "site"]);

// Kunci dinamis: dibaca saat runtime, bukan di-inline saat build,
// jadi ganti alamat cukup restart server tanpa build ulang.
export const readEnv = (key) => (process.env[key] ?? "").trim();

export function getShareMode() {
  const value = readEnv("NEXT_PUBLIC_DOWNLOAD_MODE").toLowerCase();
  if (MODES.has(value)) return value;
  return readEnv("VERCEL") ? "site" : "local";
}
