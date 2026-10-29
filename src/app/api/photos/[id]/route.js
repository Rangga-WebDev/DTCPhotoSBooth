/**
 * CIA PHOTOBOOTH — UNDUH PHOTOCARD
 *   GET /api/photos/:id             tampilkan foto
 *   GET /api/photos/:id?download=1  unduh sebagai file
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
    const photo = await getSharedPhoto(id);

    if (!photo) {
      return NextResponse.json(
        { error: "Foto tidak ditemukan atau sudah kedaluwarsa." },
        { status: 404 },
      );
    }

    const download = new URL(request.url).searchParams.get("download") === "1";
    const body = Buffer.isBuffer(photo.body) ? new Uint8Array(photo.body) : photo.body;

    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        ...(photo.size ? { "Content-Length": String(photo.size) } : {}),
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${photo.filename}"`,
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  } catch (error) {
    console.error("[CIA] Download error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan saat mengambil foto." }, { status: 500 });
  }
}
