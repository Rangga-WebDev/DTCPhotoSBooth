/** @format */

import { useSyncExternalStore } from "react";

const KEY = "dtc-session-count";
const EVENT = "dtc-session-count-change";

function subscribe(callback) {
  window.addEventListener("storage", callback);
  window.addEventListener(EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(EVENT, callback);
  };
}

function read() {
  try {
    return Number(window.localStorage.getItem(KEY)) || 0;
  } catch {
    return 0;
  }
}

// Nomor sesi berikutnya di booth ini, mis. "007". Server merender "---".
export function useSessionNumber() {
  const completed = useSyncExternalStore(subscribe, read, () => null);
  return completed === null ? "---" : String(completed + 1).padStart(3, "0");
}

// Dipanggil sekali saat foto sesi berhasil disimpan.
export function completeSession() {
  try {
    window.localStorage.setItem(KEY, String(read() + 1));
  } catch {
    // Tanpa localStorage nomor sesi tetap, booth tetap jalan.
  }
  window.dispatchEvent(new Event(EVENT));
}
