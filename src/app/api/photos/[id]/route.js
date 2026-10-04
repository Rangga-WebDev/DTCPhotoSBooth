/**
 * DTCBOOTH — PHOTO DOWNLOAD API
 *
 *   GET /api/photos/:id
 *
 *   Melihat foto:
 *   GET /api/photos/:id
 *
 *   Mengunduh foto:
 *   GET /api/photos/:id?download=1
 *
 * @format
 */

import { NextResponse } from "next/server";

import { getSharedPhoto } from "../../../../lib/photoServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          error: "ID foto tidak ditemukan.",
        },
        { status: 400 },
      );
    }

    const photo = await getSharedPhoto(id);

    if (!photo) {
      return NextResponse.json(
        {
          error: "Foto tidak ditemukan atau sudah kedaluwarsa.",
        },
        { status: 404 },
      );
    }

    const url = new URL(request.url);

    const shouldDownload = url.searchParams.get("download") === "1";

    return new Response(new Uint8Array(photo.buffer), {
      status: 200,

      headers: {
        "Content-Type": "image/jpeg",

        "Content-Length": String(photo.buffer.length),

        "Content-Disposition": shouldDownload
          ? `attachment; filename="${photo.filename}"`
          : `inline; filename="${photo.filename}"`,

        "Cache-Control": "private, no-store, max-age=0",

        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("[DTCBOOTH] Download error:", error);

    return NextResponse.json(
      {
        error: "Terjadi kesalahan saat mengambil foto.",
      },
      { status: 500 },
    );
  }
}
