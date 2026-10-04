/** @format */

import { NextResponse } from "next/server";

// Lewat tunnel publik, internet hanya boleh melihat halaman download + gambarnya.
// Kiosk, editor, dan upload API tetap khusus laptop booth / Wi-Fi booth.
const PUBLIC_PATHS = [
  /^\/d\/[0-9a-z-]+$/i,
  /^\/download\/[0-9a-z-]+$/i,
  /^\/api\/photos\/[0-9a-z-]+$/i,
  /^\/api\/share\/ping$/,
  /^\/(icon|apple-icon)$/,
];

function publicHost() {
  const key = "NEXT_PUBLIC_PUBLIC_URL";
  try {
    return process.env[key] ? new URL(process.env[key]).host : "";
  } catch {
    return "";
  }
}

function isPublicRequest(request) {
  const { headers } = request;
  if (headers.has("cf-connecting-ip") || headers.has("cf-ray")) return true;
  const host = publicHost();
  return (
    Boolean(host) &&
    (headers.get("host") === host || headers.get("x-forwarded-host") === host)
  );
}

export function proxy(request) {
  if (!isPublicRequest(request)) return NextResponse.next();

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
