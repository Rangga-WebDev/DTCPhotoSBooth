/** @format */

import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { LOGO, LOGO_MARK } from "../data/brand";

let logoDataUrl;

function getLogoDataUrl() {
  logoDataUrl ??= readFile(
    join(process.cwd(), "public", "logo", "logoDTC.jpeg"),
  ).then((buffer) => `data:image/jpeg;base64,${buffer.toString("base64")}`);
  return logoDataUrl;
}

// Ikon persegi berisi monogram DTC saja; wordmark terlalu kecil untuk dibaca di favicon.
export async function renderBrandIcon(size, inset = 0.06) {
  const src = await getLogoDataUrl();
  const scale = (size * (1 - inset * 2)) / LOGO_MARK.w;

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        background: LOGO.background,
      }}
    >
      {/* Bingkai seukuran monogram; overflow hidden memotong wordmark di bawahnya */}
      <div
        style={{
          display: "flex",
          position: "relative",
          width: LOGO_MARK.w * scale,
          height: LOGO_MARK.h * scale,
          overflow: "hidden",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse hanya menerima <img> */}
        <img
          src={src}
          alt=""
          width={LOGO.width * scale}
          height={LOGO.height * scale}
          style={{
            position: "absolute",
            left: -LOGO_MARK.x * scale,
            top: -LOGO_MARK.y * scale,
          }}
        />
      </div>
    </div>,
    { width: size, height: size },
  );
}
