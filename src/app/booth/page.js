/** @format */

import BoothView from "../../components/booth/BoothView";
import { parsePhotoCount } from "../../data/formats";
import { getTheme } from "../../data/themes";

export const metadata = {
  title: "Live camera · DTCBooth",
};

const first = (value) => (Array.isArray(value) ? value[0] : value);

export default async function BoothPage({ searchParams }) {
  const { photos, theme } = await searchParams;

  return (
    <BoothView
      photoCount={parsePhotoCount(first(photos))}
      themeId={getTheme(first(theme)).id}
    />
  );
}
