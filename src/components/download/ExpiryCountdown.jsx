/** @format */

"use client";

import useNow, { formatLeft } from "./useNow";

export default function ExpiryCountdown({ expiresAt }) {
  const now = useNow();
  if (now === null) return "—";
  const left = expiresAt - now;
  return left > 0 ? formatLeft(left) : "Habis";
}
