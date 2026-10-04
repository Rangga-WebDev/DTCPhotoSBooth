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

// Link pendek untuk QR: /d/<id>.
export default async function ShortDownloadPage({ params }) {
  const { id } = await params;
  return <DownloadView id={id} />;
}
