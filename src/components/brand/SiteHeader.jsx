/** @format */

import Link from "next/link";

import { BRAND } from "../../data/brand";
import CiaMark from "./CiaMark";

// Header bersama semua halaman; isi kanan diisi per halaman.
export default function SiteHeader({ meta, children, home = "/" }) {
  return (
    <header className="cia-header">
      <Link
        href={home}
        className="cia-header__brand"
        aria-label={`${BRAND.product}, beranda`}
      >
        <CiaMark width={34} />
        <span className="cia-header__name">
          <strong>{BRAND.product}</strong>
          <small>{BRAND.name}</small>
        </span>
      </Link>
      {meta && <div className="cia-header__meta">{meta}</div>}
      <div className="cia-header__slot">{children}</div>
    </header>
  );
}
