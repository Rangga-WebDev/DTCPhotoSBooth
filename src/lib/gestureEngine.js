/** @format */

// Mesin AI gestur. Utama: Web Worker (public/workers/gesture-worker.js) supaya inferensi
// tidak menahan main thread. Cadangan: MediaPipe di main thread kalau worker gagal.
// Satu instance per tab; tetap hidup saat pindah halaman (landing → tutorial → booth).

const MODEL_PATH = "/models/gesture_recognizer.task";
const WORKER_PATH = "/workers/gesture-worker.js";
const LOCAL_BUNDLE = "/mediapipe/vision_bundle.js";
const LOCAL_WASM = "/mediapipe/wasm";
const VERSION = process.env.NEXT_PUBLIC_MEDIAPIPE_VERSION;
const CDN = VERSION
  ? `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VERSION}`
  : null;
const INIT_TIMEOUT_MS = 120_000;

// 2 tangan cukup untuk pose hati; MediaPipe menjalankan palm detection (bagian termahal)
// setiap frame selama tangan terlacak < numHands, jadi angka kecil = deteksi lebih cepat.
export const MAX_HANDS = 2;

let enginePromise = null;
let runtime = { backend: null, wasm: null };
// Worker yang pernah gagal saat berjalan tidak dipakai lagi di tab ini.
let preferMain = false;

export function getGestureRuntime() {
  return { ...runtime, maxHands: MAX_HANDS };
}

export function loadGestureEngine() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("AI gestur hanya berjalan di browser."));
  }
  enginePromise ??= createEngine().catch((error) => {
    enginePromise = null;
    throw error;
  });
  return enginePromise;
}

// Dipanggil setelah deteksi gagal berulang kali: mesin lama ditutup, berikutnya dibuat ulang.
// preferMain diset langsung (bukan di .then) karena loadGestureEngine() dipanggil tepat sesudahnya.
export function resetGestureEngine() {
  if (runtime.backend === "worker") preferMain = true;
  const current = enginePromise;
  enginePromise = null;
  current?.then((engine) => engine.close()).catch(() => {});
}

// Dipanggil dari landing/tutorial: model sudah siap saat kamera booth menyala.
export function warmUpGestureEngine() {
  if (typeof window === "undefined") return;
  loadGestureEngine().catch(() => {});
}

const absolute = (path) => new URL(path, window.location.origin).href;
const sources = (local, cdnPath) =>
  [absolute(local), CDN && `${CDN}/${cdnPath}`].filter(Boolean);

async function createEngine() {
  const workerReady =
    !preferMain &&
    typeof Worker === "function" &&
    typeof createImageBitmap === "function" &&
    typeof OffscreenCanvas === "function";

  if (workerReady) {
    try {
      return await createWorkerEngine();
    } catch (error) {
      console.warn("[CIA] AI worker gagal, pindah ke main thread:", error);
    }
  }
  return createMainEngine();
}

function cropBox(video, rect) {
  const width = video.videoWidth;
  const height = video.videoHeight;
  return {
    sx: Math.round(rect.x * width),
    sy: Math.round(rect.y * height),
    sw: Math.max(1, Math.round(rect.w * width)),
    sh: Math.max(1, Math.round(rect.h * height)),
  };
}

function createWorkerEngine() {
  return new Promise((resolve, reject) => {
    const worker = new Worker(WORKER_PATH, { name: "cia-gesture" });
    const pending = new Map();
    let seq = 0;
    let broken = null;

    const fail = (error) => {
      broken = error;
      pending.forEach((entry) => entry.reject(error));
      pending.clear();
    };

    worker.onmessage = ({ data }) => {
      const entry = pending.get(data?.id);
      if (!entry) return;
      pending.delete(data.id);
      if (data.ok) entry.resolve(data.result);
      else entry.reject(new Error(data.error));
    };
    worker.onerror = (event) => {
      event.preventDefault?.();
      fail(new Error(event.message || "Worker AI berhenti."));
    };
    worker.onmessageerror = () => fail(new Error("Data dari worker AI rusak."));

    const call = (type, payload, transfer = []) => {
      if (broken) return Promise.reject(broken);
      return new Promise((done, failCall) => {
        const id = ++seq;
        pending.set(id, { resolve: done, reject: failCall });
        worker.postMessage({ id, type, payload }, transfer);
      });
    };

    const timer = setTimeout(() => {
      fail(new Error("Model AI terlalu lama dimuat."));
    }, INIT_TIMEOUT_MS);

    call("init", {
      bundleUrls: sources(LOCAL_BUNDLE, "vision_bundle.js"),
      wasmBases: sources(LOCAL_WASM, "wasm"),
      modelPath: absolute(MODEL_PATH),
      maxHands: MAX_HANDS,
    })
      .then((info) => {
        clearTimeout(timer);
        runtime = { backend: "worker", wasm: info?.wasm ?? null };
        resolve({
          backend: "worker",
          async detect(video, timestamp, rect, width, height, light) {
            const { sx, sy, sw, sh } = cropBox(video, rect);
            const bitmap = await createImageBitmap(video, sx, sy, sw, sh, {
              resizeWidth: width,
              resizeHeight: height,
              resizeQuality: "low",
            });
            return call("detect", { bitmap, timestamp, light }, [bitmap]);
          },
          close() {
            worker.terminate();
          },
        });
      })
      .catch((error) => {
        clearTimeout(timer);
        worker.terminate();
        reject(error);
      });
  });
}

function flatten(points) {
  if (!points?.length) return null;
  const out = new Float32Array(points.length * 3);
  points.forEach((point, index) => {
    out[index * 3] = point.x;
    out[index * 3 + 1] = point.y;
    out[index * 3 + 2] = point.z || 0;
  });
  return out;
}

// Format sama dengan pack() di worker.
function pack(result) {
  return (result.landmarks ?? []).map((landmarks, index) => {
    const top = result.gestures?.[index]?.[0];
    return {
      landmarks: flatten(landmarks),
      world: flatten(result.worldLandmarks?.[index]),
      handedness: result.handedness?.[index]?.[0]?.categoryName ?? "Unknown",
      category: top?.categoryName ?? "None",
      score: top?.score ?? 0,
    };
  });
}

async function pickWasmBase(bases) {
  for (const base of bases) {
    try {
      const response = await fetch(`${base}/vision_wasm_internal.wasm`, {
        method: "HEAD",
      });
      if (response.ok) return base;
    } catch {
      // Lanjut ke CDN.
    }
  }
  return bases.at(-1);
}

async function createMainEngine() {
  const { FilesetResolver, GestureRecognizer } =
    await import("@mediapipe/tasks-vision");
  const base = await pickWasmBase(sources(LOCAL_WASM, "wasm"));
  const fileset = await FilesetResolver.forVisionTasks(base);
  const recognizer = await GestureRecognizer.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: MODEL_PATH, delegate: "CPU" },
    runningMode: "VIDEO",
    numHands: MAX_HANDS,
    minHandDetectionConfidence: 0.5,
    minHandPresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });
  runtime = {
    backend: "main",
    wasm: new URL(base).origin === window.location.origin ? "local" : "cdn",
  };

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { alpha: false });
  const tiny = document.createElement("canvas");
  tiny.width = 16;
  tiny.height = 9;
  const tinyContext = tiny.getContext("2d", { willReadFrequently: true });

  return {
    backend: "main",
    async detect(video, timestamp, rect, width, height, light) {
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      const { sx, sy, sw, sh } = cropBox(video, rect);
      context.drawImage(video, sx, sy, sw, sh, 0, 0, width, height);

      const started = performance.now();
      const result = recognizer.recognizeForVideo(canvas, timestamp);
      const cost = performance.now() - started;

      let brightness = null;
      if (light) {
        tinyContext.drawImage(canvas, 0, 0, 16, 9);
        const data = tinyContext.getImageData(0, 0, 16, 9).data;
        let sum = 0;
        for (let i = 0; i < data.length; i += 4) {
          sum += data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        }
        brightness = sum / (data.length / 4) / 255;
      }
      return { hands: pack(result), cost, light: brightness };
    },
    close() {
      recognizer.close();
    },
  };
}
