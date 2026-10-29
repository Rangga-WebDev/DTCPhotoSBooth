/**
 * CIA PHOTOBOOTH — HAPUS FOTO KEDALUWARSA
 *   GET /api/cleanup  dengan header Authorization: Bearer <CRON_SECRET>
 *   Vercel Cron mengirim header ini otomatis kalau env CRON_SECRET diisi (lihat vercel.json).
 *
 * @format
 */

import { createHash, timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { cleanupExpiredPhotos } from "../../../lib/photoServer";
import { readEnv } from "../../../lib/shareMode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const digest = (value) => createHash("sha256").update(value).digest();

export async function GET(request) {
  const secret = readEnv("CRON_SECRET");
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET belum diisi." }, { status: 503 });
  }

  const header = request.headers.get("authorization") ?? "";
  if (!timingSafeEqual(digest(header), digest(`Bearer ${secret}`))) {
    return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
  }

  try {
    const deleted = await cleanupExpiredPhotos();
    return NextResponse.json({ deleted }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[CIA] Cleanup error:", error);
    return NextResponse.json({ error: "Pembersihan gagal." }, { status: 500 });
  }
}
