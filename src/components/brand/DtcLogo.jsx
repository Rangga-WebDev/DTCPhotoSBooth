/** @format */

import Image from "next/image";
import logo from "../../../public/logo/logoDTC.jpeg";
import { LOGO, LOGO_MARK } from "../../data/brand";

// Posisi gambar agar hanya monogram DTC yang terlihat di dalam bingkai crop.
const MARK_IMAGE_STYLE = {
  width: `${(LOGO.width / LOGO_MARK.w) * 100}%`,
  left: `${(-LOGO_MARK.x / LOGO_MARK.w) * 100}%`,
  top: `${(-LOGO_MARK.y / LOGO_MARK.h) * 100}%`,
};

/**
 * variant "full" = logo utuh, "mark" = monogram saja.
 * plate = logo diletakkan di pelat terang (wajib di permukaan gelap).
 */
export default function DtcLogo({
  variant = "full",
  plate = false,
  width,
  decorative = false,
  preload = false,
  sizes,
  className = "",
}) {
  const classes = [
    "dtc-logo",
    `dtc-logo--${variant}`,
    plate && "dtc-logo--plate",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  const alt = decorative ? "" : LOGO.alt;
  const style = width ? { width } : undefined;

  if (variant === "mark") {
    // Gambar di dalam crop tampil ±1.63× lebar monogram; sizes harus ikut supaya srcset tidak kebesaran.
    const markSizes =
      sizes ??
      (typeof width === "number"
        ? `${Math.ceil((width * LOGO.width) / LOGO_MARK.w)}px`
        : "240px");

    return (
      <span
        className={classes}
        style={style}
        role={decorative ? undefined : "img"}
        aria-label={decorative ? undefined : LOGO.alt}
        aria-hidden={decorative || undefined}
      >
        <span
          className="dtc-logo__crop"
          style={{ aspectRatio: `${LOGO_MARK.w} / ${LOGO_MARK.h}` }}
        >
          <Image
            src={logo}
            alt=""
            sizes={markSizes}
            preload={preload}
            style={MARK_IMAGE_STYLE}
          />
        </span>
      </span>
    );
  }

  return (
    <span
      className={classes}
      style={style}
      aria-hidden={decorative || undefined}
    >
      <Image
        src={logo}
        alt={alt}
        sizes={sizes ?? "(max-width: 640px) 70vw, 420px"}
        preload={preload}
      />
    </span>
  );
}
