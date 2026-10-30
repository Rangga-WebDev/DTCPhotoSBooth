/** @format */

import { COLORS, MARK, MARK_INK } from "../../data/brand";

/**
 * Logo CIA versi datar (vektor). tone: "dark" = di latar gelap, "light" = di latar terang,
 * "mono" = satu warna mengikuti currentColor.
 */
export default function CiaMark({ width = 40, tone = "dark", title, className }) {
  const red = tone === "mono" ? "currentColor" : COLORS.red;
  const ink = tone === "mono" ? "currentColor" : (MARK_INK[tone] ?? MARK_INK.dark);
  const height = Math.round((width * MARK.height) / MARK.width);

  return (
    <svg
      viewBox={`0 0 ${MARK.width} ${MARK.height}`}
      width={width}
      height={height}
      className={className ? `cia-mark ${className}` : "cia-mark"}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      <path d={MARK.red} fill={red} />
      <path d={MARK.ink} fill={ink} />
    </svg>
  );
}
