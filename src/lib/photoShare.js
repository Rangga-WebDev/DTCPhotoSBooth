/** @format */

import { canvasToJpeg } from "./photocard";

// Upload photocard ke server booth. Alamat QR (local/public) ditentukan server.
const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
const FALLBACK_TTL_MS = 24 * 60 * 60 * 1000;

// JPG 300 dpi (4R) supaya file yang diunduh lewat QR juga tercetak 4 × 6 inci.
async function createUploadBlob(canvas) {
  for (const quality of [0.9, 0.8, 0.7]) {
    const blob = await canvasToJpeg(canvas, quality);
    if (blob.size <= MAX_UPLOAD_BYTES) return blob;
  }
  throw new Error("Ukuran photocard lebih dari 15 MB.");
}

// onStep("compress" | "upload") untuk label status yang jujur di UI.
export async function uploadPhotocard(canvas, { signal, onStep } = {}) {
  onStep?.("compress");
  const blob = await createUploadBlob(canvas);
  signal?.throwIfAborted();

  onStep?.("upload");
  const data = new FormData();
  data.append("photo", blob, "DTCBooth-photocard.jpg");
  const response = await fetch("/api/photos", {
    method: "POST",
    body: data,
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
    mode: result.mode === "public" ? "public" : "local",
    fallback: Boolean(result.fallback),
    expiresAt: result.expiresAt ?? Date.now() + FALLBACK_TTL_MS,
    bytes: blob.size,
  };
}
