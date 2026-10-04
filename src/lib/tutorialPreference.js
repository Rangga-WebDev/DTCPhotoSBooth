/** @format */

import { useSyncExternalStore } from "react";

const KEY = "dtc-skip-tutorial";
const EVENT = "dtc-skip-tutorial-change";

function subscribe(callback) {
  window.addEventListener(EVENT, callback);
  return () => window.removeEventListener(EVENT, callback);
}

function read() {
  try {
    return window.sessionStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

// "Jangan tampilkan lagi" berlaku per tab sampai sesi pengunjung di-reset.
export function useSkipTutorial() {
  return useSyncExternalStore(subscribe, read, () => false);
}

export function setSkipTutorial(skip) {
  try {
    if (skip) window.sessionStorage.setItem(KEY, "1");
    else window.sessionStorage.removeItem(KEY);
  } catch {
    // sessionStorage bisa diblokir; tutorial tetap tampil.
  }
  window.dispatchEvent(new Event(EVENT));
}
