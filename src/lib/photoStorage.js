/**
 * DTCBOOTH — PHOTO STORAGE
 *   Menggunakan IndexedDB.
 *
 * @format
 */

// Nama DB lama sengaja dipertahankan: mengganti nama membuat sesi yang sedang berjalan hilang.
const DB_NAME = "TeknikFestPhotoBooth";
const DB_VERSION = 1;
const STORE_NAME = "sessions";

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

// Konversi foto Base64 menjadi Blob
async function dataUrlToBlob(dataUrl) {
  const response = await fetch(dataUrl);
  return await response.blob();
}

// Menyimpan satu sesi photobooth
export async function savePhotoSession({
  photos,
  themeId,
  photoCount,
  sessionNumber,
}) {
  if (!Array.isArray(photos) || photos.length < 1 || photos.length > 6) {
    throw new Error("Jumlah foto tidak valid.");
  }

  const db = await openPhotoDB();

  try {
    const photoBlobs = await Promise.all(photos.map(dataUrlToBlob));

    const sessionId = crypto.randomUUID();

    const session = {
      id: sessionId,
      photos: photoBlobs,
      themeId,
      photoCount,
      sessionNumber,
      createdAt: Date.now(),
    };

    await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");

      transaction.objectStore(STORE_NAME).put(session);

      transaction.oncomplete = () => resolve();

      transaction.onerror = () => {
        reject(transaction.error || new Error("Gagal menyimpan sesi."));
      };

      transaction.onabort = () => {
        reject(transaction.error || new Error("Penyimpanan dibatalkan."));
      };
    });

    return sessionId;
  } finally {
    db.close();
  }
}

// Mengambil sesi berdasarkan ID
export async function getPhotoSession(id) {
  const db = await openPhotoDB();

  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");

      const request = transaction.objectStore(STORE_NAME).get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        reject(request.error || new Error("Gagal membaca sesi."));
      };
    });
  } finally {
    db.close();
  }
}

// Menyimpan pilihan setelah foto (mis. frameId photocard) ke sesi yang sama.
export async function updatePhotoSession(id, patch) {
  const db = await openPhotoDB();

  try {
    await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        if (!request.result) {
          transaction.abort();
          return;
        }
        store.put({ ...request.result, ...patch });
      };

      transaction.oncomplete = () => resolve();
      transaction.onabort = () =>
        reject(transaction.error || new Error("Sesi foto tidak ditemukan."));
      transaction.onerror = () =>
        reject(transaction.error || new Error("Gagal menyimpan pilihan."));
    });
  } finally {
    db.close();
  }
}

// Menghapus sesi tertentu
export async function deletePhotoSession(id) {
  const db = await openPhotoDB();

  try {
    await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");

      transaction.objectStore(STORE_NAME).delete(id);

      transaction.oncomplete = () => resolve();

      transaction.onerror = () => {
        reject(transaction.error || new Error("Gagal menghapus sesi."));
      };
    });
  } finally {
    db.close();
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
