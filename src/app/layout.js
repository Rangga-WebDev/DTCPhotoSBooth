/** @format */

import "@fontsource/barlow/latin-400.css";
import "@fontsource/barlow/latin-500.css";
import "@fontsource/barlow/latin-600.css";
import "@fontsource/barlow-condensed/latin-600.css";
import "@fontsource/barlow-condensed/latin-700.css";
import "@fontsource/barlow-condensed/latin-800.css";

import "./cia.css";
import KioskControls from "../components/kiosk/KioskControls";

export const metadata = {
  title: "CIA Photobooth · Civil In Action",
  description:
    "Photobooth AI Teknik Sipil untuk Civil In Action. Foto pakai hand sign, hasilnya dibawa pulang lewat QR.",
  applicationName: "CIA Photobooth",
};

export const viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        {children}
        <KioskControls />
      </body>
    </html>
  );
}
