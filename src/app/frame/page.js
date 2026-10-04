/** @format */

import FramePicker from "../../components/frame/FramePicker";

export const metadata = {
  title: "Choose your frame · DTCBooth",
};

export default async function FramePage({ searchParams }) {
  const { session } = await searchParams;
  const sessionId = Array.isArray(session) ? session[0] : session;

  return <FramePicker sessionId={sessionId ?? ""} />;
}
