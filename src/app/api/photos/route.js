/**
 * CIA PHOTOBOOTH — UPLOAD PHOTOCARD
 *   POST /api/photos  (multipart/form-data, photo: JPEG)
 *   → { id, shareUrl, mode, fallback, downloadPath, imagePath, expiresAt }
 *
 * @format
 */

import { NextResponse } from "next/server";

import { boothKeyStatus } from "../../../lib/boothAccess";
import { MAX_PHOTO_BYTES, getStorageStatus, saveSharedPhoto } from "../../../lib/photoServer";
import { resolveShareTarget } from "../../../lib/shareConfig";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const fail = (error, status) => NextResponse.json({ error }, { status });

export async function POST(request) {
  try {
    const key = boothKeyStatus(request);
    if (!key.valid) {
      if (!key.configured) {
        return fail(
          "Website publik wajib memakai BOOTH_ACCESS_KEY. Isi env itu di server, deploy ulang, lalu buka /?key=KUNCI sekali di laptop booth.",
          503,
        );
      }
      return fail(
        key.provided
          ? "Kunci booth salah. Buka halaman utama dengan ?key=KUNCI yang benar."
          : "Booth belum diaktifkan. Buka halaman utama dengan ?key=KUNCI sekali di laptop booth.",
        401,
      );
    }

    const storage = getStorageStatus();
    if (!storage.ready) return fail(storage.error, 503);

    const contentLength = Number(request.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > MAX_PHOTO_BYTES + 1024 * 1024) {
      return fail("Ukuran unggahan terlalu besar.", 413);
    }

    const formData = await request.formData();
    const photo = formData.get("photo");
    if (!photo || typeof photo === "string") return fail("File foto tidak ditemukan.", 400);
    if (photo.type !== "image/jpeg" && photo.type !== "image/jpg") {
      return fail("Hanya file JPEG yang diperbolehkan.", 415);
    }
    if (photo.size === 0 || photo.size > MAX_PHOTO_BYTES) {
      return fail("Ukuran foto tidak valid. Maksimum 8 MB.", 413);
    }

    // Alamat QR dicek dulu supaya tidak ada file tersimpan tanpa link yang bisa dibuka.
    let target;
    try {
      target = await resolveShareTarget(request);
    } catch (error) {
      return fail(error.message, 503);
    }

    const result = await saveSharedPhoto(Buffer.from(await photo.arrayBuffer()));
    const downloadPath = `/d/${result.id}`;

    return NextResponse.json(
      {
        success: true,
        id: result.id,
        shareUrl: new URL(downloadPath, target.origin).href,
        mode: target.mode,
        fallback: target.fallback,
        downloadPath,
        imagePath: `/api/photos/${result.id}`,
        expiresAt: result.expiresAt,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[CIA] Upload error:", error);
    // Alasan asli (mis. "Vercel Blob: This store does not exist.") membantu operator memperbaiki konfigurasi.
    const reason = error?.message ? ` (${error.message})` : "";
    return fail(`Foto gagal disimpan di server booth${reason}. Coba lagi.`, 500);
  }
}

export function GET() {
  return NextResponse.json({ message: "Gunakan POST untuk mengunggah foto." }, { status: 405 });
}
