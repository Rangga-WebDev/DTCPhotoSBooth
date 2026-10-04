/**
 * DTCBOOTH — PHOTO UPLOAD API
 *
 *   POST /api/photos  (multipart/form-data, photo: JPEG)
 *   → { id, shareUrl, mode, fallback, downloadPath, imagePath, expiresAt }
 *
 * @format
 */

import { NextResponse } from "next/server";

import { saveSharedPhoto, MAX_PHOTO_BYTES } from "../../../lib/photoServer";
import { resolveShareTarget } from "../../../lib/shareConfig";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    // Tolak unggahan jika Content-Length
    // sudah melebihi batas yang diizinkan.
    const contentLength = Number(request.headers.get("content-length"));

    if (
      Number.isFinite(contentLength) &&
      contentLength > MAX_PHOTO_BYTES + 1024 * 1024
    ) {
      return NextResponse.json(
        {
          error: "Ukuran unggahan terlalu besar.",
        },
        { status: 413 },
      );
    }

    const formData = await request.formData();

    const photo = formData.get("photo");

    if (!photo || typeof photo === "string") {
      return NextResponse.json(
        {
          error: "File foto tidak ditemukan.",
        },
        { status: 400 },
      );
    }

    // Pastikan yang dikirim adalah JPEG.
    if (photo.type !== "image/jpeg" && photo.type !== "image/jpg") {
      return NextResponse.json(
        {
          error: "Hanya file JPEG yang diperbolehkan.",
        },
        { status: 415 },
      );
    }

    if (photo.size === 0 || photo.size > MAX_PHOTO_BYTES) {
      return NextResponse.json(
        {
          error: "Ukuran foto tidak valid. Maksimum 15 MB.",
        },
        { status: 413 },
      );
    }

    // Alamat QR dicek dulu supaya tidak ada file tersimpan tanpa link yang bisa dibuka.
    let target;
    try {
      target = await resolveShareTarget();
    } catch (error) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    // Ubah File menjadi Buffer untuk disimpan.
    const arrayBuffer = await photo.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Pemeriksaan tambahan dilakukan
    // di dalam saveSharedPhoto().
    const result = await saveSharedPhoto(buffer);
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
    console.error("[DTCBOOTH] Upload error:", error);

    return NextResponse.json(
      {
        error: "Foto gagal disimpan di laptop booth. Coba lagi.",
      },
      { status: 500 },
    );
  }
}

// Nonaktifkan metode GET pada endpoint upload.
export async function GET() {
  return NextResponse.json(
    {
      message: "Gunakan POST untuk mengunggah foto.",
    },
    { status: 405 },
  );
}
