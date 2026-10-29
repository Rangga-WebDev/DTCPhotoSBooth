/** @format */

// Kunci upload booth (opsional, untuk website yang di-deploy publik).
// Operator membuka /?key=KUNCI sekali di laptop booth; kunci disimpan di localStorage.
const STORAGE_KEY = "cia-booth-key";
export const BOOTH_KEY_HEADER = "x-booth-key";

export function getBoothKey() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

export function setBoothKey(value) {
  try {
    if (value) window.localStorage.setItem(STORAGE_KEY, value);
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // localStorage diblokir: upload tetap jalan kalau server tidak mewajibkan kunci.
  }
}

export function boothKeyHeaders() {
  const key = getBoothKey();
  return key ? { [BOOTH_KEY_HEADER]: key } : {};
}
