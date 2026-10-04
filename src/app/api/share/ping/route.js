/** @format */

import { NextResponse } from "next/server";

import { getInstanceId } from "../../../../lib/shareConfig";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Dipanggil server sendiri lewat URL publik untuk membuktikan tunnel tersambung.
export function GET() {
  return NextResponse.json(
    { ok: true, instance: getInstanceId() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
