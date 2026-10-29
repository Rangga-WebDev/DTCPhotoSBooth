/** @format */

import EditorView from "../../components/editor/EditorView";

export const metadata = {
  title: "Ambil foto · CIA Photobooth",
};

export default async function EditorPage({ searchParams }) {
  const { session } = await searchParams;
  const sessionId = Array.isArray(session) ? session[0] : session;

  return <EditorView sessionId={sessionId ?? ""} />;
}
