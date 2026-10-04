/** @format */

import "@fontsource-variable/archivo/wdth.css";
import "@fontsource/instrument-sans/400.css";
import "@fontsource/instrument-sans/600.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@fontsource/ibm-plex-mono/600.css";

import "./dtc-system.css";
import KioskControls from "../components/kiosk/KioskControls";

export const metadata = {
  title: "DTCBooth · DTC 2026",
  description:
    "DTCBooth, AI photobooth DTC 2026 (Discovery Technology Creative). Foto pakai gestur tangan, hasilnya diambil lewat QR.",
  applicationName: "DTCBooth",
};

export const viewport = {
  themeColor: "#07152B",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" data-scroll-behavior="smooth">
      <body>
        {children}
        <KioskControls />
      </body>
    </html>
  );
}
