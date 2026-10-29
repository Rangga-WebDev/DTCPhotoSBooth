/** @format */

import { boothKeyHeaders } from "./boothKey";
import { canvasToJpeg } from "./photocard";

// Upload photocard ke server booth. Alamat QR (local / public / site) ditentukan server.
// Batas 4 MB supaya aman juga di Vercel Functions (body maks ± 4,5 MB).
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const FALLBACK_TTL_MS = 24 * 60 * 60 * 1000;

// JPG 300 dpi (4R) supaya file yang diunduh lewat QR juga tercetak 4 × 6 inci.
async function createUploadBlob(canvas) {
  for (const quality of [0.92, 0.85, 0.75, 0.65]) {
    const blob = await canvasToJpeg(canvas, quality);
    if (blob.size <= MAX_UPLOAD_BYTES) return blob;
  }
  throw new Error("Ukuran photocard lebih dari 4 MB.");
}

// onStep("compress" | "upload") untuk label status yang jujur di UI.
export async function uploadPhotocard(canvas, { signal, onStep } = {}) {
  onStep?.("compress");
  const blob = await createUploadBlob(canvas);
  signal?.throwIfAborted();

  onStep?.("upload");
  const data = new FormData();
  data.append("photo", blob, "CIA-Photobooth.jpg");
  const response = await fetch("/api/photos", {
    method: "POST",
    body: data,
    headers: boothKeyHeaders(),
    signal,
  });
  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.error || `Upload gagal (HTTP ${response.status}).`);
  }
  if (!result.id || !result.shareUrl) {
    throw new Error("Server tidak mengirim link unduhan.");
  }

  return {
    id: result.id,
    url: result.shareUrl,
    mode: ["public", "site"].includes(result.mode) ? result.mode : "local",
    fallback: Boolean(result.fallback),
    expiresAt: result.expiresAt ?? Date.now() + FALLBACK_TTL_MS,
    bytes: blob.size,
  };
}
