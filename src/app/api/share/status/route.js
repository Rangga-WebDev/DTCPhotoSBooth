/** @format */

import { NextResponse } from "next/server";

import {
  checkPublicReachable,
  getShareConfig,
  parseLocalOrigin,
  parsePublicOrigin,
} from "../../../../lib/shareConfig";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function check(parse, value) {
  try {
    return { origin: parse(value), error: null };
  } catch (error) {
    return { origin: null, error: error.message };
  }
}

// Status QR untuk panel operator (diblokir dari tunnel oleh proxy).
export async function GET() {
  const { mode, publicUrl, localUrl } = getShareConfig();
  const local = check(parseLocalOrigin, localUrl);
  const pub =
    mode === "public"
      ? check(parsePublicOrigin, publicUrl)
      : { origin: null, error: null };
  const publicReachable = pub.origin
    ? await checkPublicReachable(pub.origin)
    : null;

  return NextResponse.json(
    {
      mode,
      local,
      public: { ...pub, reachable: publicReachable },
      active:
        mode === "public" && publicReachable
          ? "public"
          : local.origin
            ? "local"
            : null,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
