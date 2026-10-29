/** @format */

import { NextResponse } from "next/server";

import { boothKeyStatus } from "../../../../lib/boothAccess";
import { getStorageStatus } from "../../../../lib/photoServer";
import { getShareStatus } from "../../../../lib/shareConfig";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Status untuk panel operator & preflight: alamat QR, penyimpanan, kunci booth.
// Lewat tunnel publik route ini diblokir oleh proxy.
export async function GET(request) {
  const share = await getShareStatus(request);
  const key = boothKeyStatus(request);

  return NextResponse.json(
    {
      ...share,
      storage: getStorageStatus(),
      key: {
        required: key.required,
        configured: key.configured,
        provided: key.provided,
        valid: key.valid,
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
