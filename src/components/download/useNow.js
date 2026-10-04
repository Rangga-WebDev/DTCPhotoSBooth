/** @format */

"use client";

import { useSyncExternalStore } from "react";

const TICK_MS = 15000;

function subscribe(callback) {
  const id = setInterval(callback, TICK_MS);
  return () => clearInterval(id);
}

// Dibulatkan ke atas supaya sisa waktu tidak pernah terlihat lebih lama dari aslinya.
const currentTick = () => Math.ceil(Date.now() / TICK_MS);

// Waktu sekarang (resolusi 15 dtk); null saat SSR/hidrasi supaya HTML tidak berbeda.
export default function useNow() {
  const tick = useSyncExternalStore(subscribe, currentTick, () => null);
  return tick === null ? null : tick * TICK_MS;
}

export function formatLeft(ms) {
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return "kurang dari 1 menit";
  const hours = Math.floor(minutes / 60);
  return hours ? `${hours} jam ${minutes % 60} menit` : `${minutes} menit`;
}
