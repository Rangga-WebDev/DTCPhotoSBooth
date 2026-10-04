/** @format */

import Link from "next/link";
import DtcLogo from "./DtcLogo";

// Header dipakai bersama semua halaman DTC; isi kanan diisi per halaman.
// logoPlate wajib di permukaan gelap (latar JPEG logo terang).
export default function DtcHeader({ meta, logoPlate = false, children }) {
  return (
    <header className="dtc-header">
      <Link
        href="/"
        className="dtc-header__brand"
        aria-label="DTCBooth, beranda"
      >
        <DtcLogo variant="mark" width={40} plate={logoPlate} decorative />
        <span className="dtc-wide">DTCBooth</span>
      </Link>
      {meta && (
        <div className="dtc-header__meta dtc-meta dtc-slashes">{meta}</div>
      )}
      <div className="dtc-header__slot">{children}</div>
    </header>
  );
}
