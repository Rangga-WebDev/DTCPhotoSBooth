/** @format */

import { NextResponse } from "next/server";

import { getShareMode, readEnv } from "./lib/shareMode";

// Laptop booth yang dibuka lewat tunnel publik: internet hanya boleh melihat halaman
// download + gambarnya. Kiosk, editor, dan upload tetap khusus laptop / Wi-Fi booth.
// Website yang di-deploy (mode site) memang publik, jadi tidak disaring di sini;
// upload dilindungi BOOTH_ACCESS_KEY.
const PUBLIC_PATHS = [
  /^\/d\/[0-9a-z-]+$/i,
  /^\/download\/[0-9a-z-]+$/i,
  /^\/api\/photos\/[0-9a-z-]+$/i,
  /^\/api\/share\/ping$/,
  /^\/(icon\.svg|apple-icon\.png|favicon\.ico)$/,
  /^\/logo\/[\w.-]+$/,
];

function isTunnelRequest(request) {
  const { headers } = request;
  if (headers.has("cf-connecting-ip") || headers.has("cf-ray")) return true;
  let host = "";
  try {
    const value = readEnv("NEXT_PUBLIC_PUBLIC_URL");
    host = value ? new URL(value).host : "";
  } catch {
    host = "";
  }
  return (
    Boolean(host) &&
    (headers.get("host") === host || headers.get("x-forwarded-host") === host)
  );
}

export function proxy(request) {
  if (getShareMode() === "site" || !isTunnelRequest(request)) return NextResponse.next();

  const { pathname } = request.nextUrl;
  const allowed =
    (request.method === "GET" || request.method === "HEAD") &&
    PUBLIC_PATHS.some((pattern) => pattern.test(pathname));

  if (!allowed) {
    return new NextResponse("Not found", {
      status: 404,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "text/plain; charset=utf-8",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  }

  const response = NextResponse.next();
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export const config = {
  // Aset build (_next/static, _next/image) bersifat publik dan tidak disaring.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
