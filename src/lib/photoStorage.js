/**
 * CIA PHOTOBOOTH — PHOTO STORAGE
 *   Sesi foto mentah disimpan di IndexedDB browser booth, dengan salinan di memori tab.
 *   IndexedDB bisa gagal menulis (disk hampir penuh, database rusak, antivirus, mode tamu):
 *   alur foto → desain → QR tetap jalan dari memori selama tab tidak di-reload.
 *
 * @format
 */

// Nama DB lama sengaja dipertahankan: mengganti nama membuat sesi yang sedang berjalan hilang.
const DB_NAME = "TeknikFestPhotoBooth";
const DB_VERSION = 1;
const STORE_NAME = "sessions";
const DB_TIMEOUT_MS = 4000;
// Sesi yang ditinggal tanpa "Mulai sesi baru" dihapus otomatis supaya foto mentah tidak menumpuk.
const MAX_AGE_MS = 6 * 60 * 60 * 1000;
const MEMORY_LIMIT = 3;

// Navigasi Next.js tidak me-reload halaman, jadi Map ini bertahan dari booth sampai QR.
const memory = new Map();

function remember(session) {
  memory.delete(session.id);
  memory.set(session.id, session);
  while (memory.size > MEMORY_LIMIT) memory.delete(memory.keys().next().value);
}

export function openPhotoDB() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error("Browser tidak mendukung IndexedDB."));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error("Gagal membuka database."));
    };
  });
}

function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error("Penyimpanan browser tidak menjawab.")), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

// Satu transaksi; operate(store) boleh mengembalikan request yang hasilnya dikembalikan.
async function transact(mode, operate) {
  const db = await openPhotoDB();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, mode);
      let failure = null;
      // Error request (mis. "backing store error" Chrome) datang lebih dulu, saat
      // transaction.error masih null; error asli itulah yang dilaporkan.
      transaction.onerror = (event) => {
        failure ??= event.target?.error ?? null;
      };
      transaction.onabort = () =>
        reject(failure ?? transaction.error ?? new Error("Penyimpanan browser dibatalkan."));
      const request = operate(transaction.objectStore(STORE_NAME));
      transaction.oncomplete = () => resolve(request?.result);
    });
  } finally {
    db.close();
  }
}

const run = (mode, operate) => withTimeout(transact(mode, operate), DB_TIMEOUT_MS);

function storageError(error, message) {
  if (error?.name === "QuotaExceededError") {
    return new Error("Penyimpanan browser penuh. Kosongkan ruang disk laptop, lalu ulangi sesi foto.");
  }
  const reason = [error?.name, error?.message].filter(Boolean).join(": ");
  return new Error(reason ? `${message} (${reason})` : message);
}

function warnMemoryOnly(what, error) {
  console.warn(`[CIA] ${what} tidak tersimpan di IndexedDB; sesi tetap jalan dari memori tab.`, error);
}

// Foto dari kamera sudah berupa Blob; data URL lama tetap diterima.
async function toBlob(photo) {
  if (photo instanceof Blob) return photo;
  const response = await fetch(photo);
  return await response.blob();
}

// Menyimpan satu sesi photobooth. Gagal menulis ke IndexedDB tidak menghentikan sesi.
export async function savePhotoSession({ photos, photoCount, sessionNumber }) {
  if (!Array.isArray(photos) || photos.length < 1 || photos.length > 6) {
    throw new Error("Jumlah foto tidak valid.");
  }

  const session = {
    id: crypto.randomUUID(),
    photos: await Promise.all(photos.map(toBlob)),
    photoCount,
    sessionNumber,
    createdAt: Date.now(),
  };
  remember(session);

  try {
    await run("readwrite", (store) => store.put(session));
    pruneOldSessions();
  } catch (error) {
    warnMemoryOnly("Sesi foto", error);
  }
  return session.id;
}

// Sesi lama dibersihkan di latar belakang; kegagalannya tidak mengganggu booth.
function pruneOldSessions() {
  const cutoff = Date.now() - MAX_AGE_MS;
  run("readwrite", (store) => {
    const cursorRequest = store.openCursor();
    cursorRequest.onsuccess = () => {
      const cursor = cursorRequest.result;
      if (!cursor) return;
      if (!(cursor.value?.createdAt > cutoff)) cursor.delete();
      cursor.continue();
    };
  }).catch((error) => console.warn("[CIA] Sesi lama gagal dibersihkan:", error));
}

// Mengambil sesi berdasarkan ID: memori tab dulu, lalu IndexedDB (mis. setelah reload).
export async function getPhotoSession(id) {
  const cached = memory.get(id);
  if (cached) return { ...cached };

  let stored;
  try {
    stored = await run("readonly", (store) => store.get(id));
  } catch (error) {
    throw storageError(error, "Sesi foto gagal dibaca dari browser.");
  }
  if (!stored) return null;
  remember(stored);
  return { ...stored };
}

// Menyimpan pilihan setelah foto (mis. frameId photocard) ke sesi yang sama.
export async function updatePhotoSession(id, patch) {
  const current = memory.get(id) ?? (await getPhotoSession(id));
  if (!current) throw new Error("Sesi foto tidak ditemukan.");

  const next = { ...current, ...patch };
  remember(next);
  try {
    await run("readwrite", (store) => store.put(next));
  } catch (error) {
    warnMemoryOnly("Pilihan desain", error);
  }
}

// Menghapus sesi tertentu. Pengunjung berikutnya tidak boleh tertahan karena IndexedDB.
export async function deletePhotoSession(id) {
  memory.delete(id);
  try {
    await run("readwrite", (store) => store.delete(id));
  } catch (error) {
    console.warn("[CIA] Sesi lama gagal dihapus dari IndexedDB:", error);
  }
}

// Konversi Blob menjadi Object URL.
// URL ini hanya berlaku di browser yang membuatnya.
export function createPhotoUrls(photoBlobs) {
  return photoBlobs.map((blob) => URL.createObjectURL(blob));
}

export function revokePhotoUrls(urls) {
  urls.forEach((url) => {
    URL.revokeObjectURL(url);
  });
}
