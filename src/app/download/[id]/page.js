/** @format */

import DownloadView, {
  downloadMetadata,
} from "../../../components/download/DownloadView";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { id } = await params;
  return downloadMetadata(id);
}

// Alamat lama (QR sebelum Tahap 10) tetap dilayani.
export default async function DownloadPage({ params }) {
  const { id } = await params;
  return <DownloadView id={id} />;
}
