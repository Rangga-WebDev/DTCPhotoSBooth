/** @format */

import BoothView from "../../components/booth/BoothView";
import { parsePhotoCount } from "../../data/formats";

export const metadata = {
  title: "Kamera · CIA Photobooth",
};

const first = (value) => (Array.isArray(value) ? value[0] : value);

export default async function BoothPage({ searchParams }) {
  const { photos } = await searchParams;
  return <BoothView photoCount={parsePhotoCount(first(photos))} />;
}
