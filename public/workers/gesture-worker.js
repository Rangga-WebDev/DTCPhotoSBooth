/**
 * CIA PHOTOBOOTH — gesture worker (classic worker, sengaja tidak dibundel).
 * MediaPipe GestureRecognizer berjalan di thread terpisah supaya video, countdown,
 * dan animasi di main thread tetap mulus. Dipanggil oleh src/lib/gestureEngine.js.
 *
 * Pesan masuk : { id, type: "init" | "detect" | "close", payload }
 * Pesan keluar: { id, ok: true, result } atau { id, ok: false, error }
 */

"use strict";

let recognizer = null;
let runtime = null;
let lightCanvas = null;
let lightContext = null;

function loadBundle(urls) {
  let lastError = null;
  for (const url of urls) {
    try {
      importScripts(url);
      if (self.Vision && self.Vision.GestureRecognizer) return url;
    } catch (error) {
      lastError = error;
    }
  }
  throw new Error(
    "Library MediaPipe gagal dimuat di worker" +
      (lastError ? ": " + (lastError.message || lastError) : "."),
  );
}

async function pickWasmBase(bases) {
  for (const base of bases) {
    try {
      const response = await fetch(base + "/vision_wasm_internal.wasm", {
        method: "HEAD",
      });
      if (response.ok) return base;
    } catch {
      // Coba sumber berikutnya (CDN).
    }
  }
  return bases[bases.length - 1];
}

async function init(options) {
  if (recognizer) return runtime;

  const bundle = loadBundle(options.bundleUrls);
  const base = await pickWasmBase(options.wasmBases);
  const { FilesetResolver, GestureRecognizer } = self.Vision;
  const fileset = await FilesetResolver.forVisionTasks(base);

  recognizer = await GestureRecognizer.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: options.modelPath, delegate: "CPU" },
    runningMode: "VIDEO",
    numHands: options.maxHands,
    minHandDetectionConfidence: 0.5,
    minHandPresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });

  const isLocal = (url) => new URL(url, self.location.href).origin === self.location.origin;
  runtime = {
    wasm: isLocal(base) ? "local" : "cdn",
    bundle: isLocal(bundle) ? "local" : "cdn",
  };
  return runtime;
}

// Kecerahan rata-rata (0–1) dari versi 16 × 9 frame; murah, untuk petunjuk "cahaya kurang".
function measureLight(bitmap) {
  if (!lightCanvas) {
    lightCanvas = new OffscreenCanvas(16, 9);
    lightContext = lightCanvas.getContext("2d", { willReadFrequently: true });
  }
  lightContext.drawImage(bitmap, 0, 0, 16, 9);
  const data = lightContext.getImageData(0, 0, 16, 9).data;
  let sum = 0;
  for (let i = 0; i < data.length; i += 4) {
    sum += data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
  }
  return sum / (data.length / 4) / 255;
}

function flatten(points) {
  if (!points || !points.length) return null;
  const out = new Float32Array(points.length * 3);
  for (let i = 0; i < points.length; i++) {
    out[i * 3] = points[i].x;
    out[i * 3 + 1] = points[i].y;
    out[i * 3 + 2] = points[i].z || 0;
  }
  return out;
}

function pack(result, transfer) {
  const hands = [];
  const count = (result.landmarks && result.landmarks.length) || 0;
  for (let i = 0; i < count; i++) {
    const top = result.gestures && result.gestures[i] && result.gestures[i][0];
    const side =
      result.handedness && result.handedness[i] && result.handedness[i][0];
    const landmarks = flatten(result.landmarks[i]);
    const world = flatten(result.worldLandmarks && result.worldLandmarks[i]);
    if (landmarks) transfer.push(landmarks.buffer);
    if (world) transfer.push(world.buffer);
    hands.push({
      landmarks,
      world,
      handedness: (side && side.categoryName) || "Unknown",
      category: (top && top.categoryName) || "None",
      score: (top && top.score) || 0,
    });
  }
  return hands;
}

function detect(payload, transfer) {
  const bitmap = payload.bitmap;
  try {
    const started = performance.now();
    const result = recognizer.recognizeForVideo(bitmap, payload.timestamp);
    const cost = performance.now() - started;
    const light = payload.light ? measureLight(bitmap) : null;
    return { hands: pack(result, transfer), cost, light };
  } finally {
    bitmap.close();
  }
}

self.onmessage = async (event) => {
  const { id, type, payload } = event.data || {};
  const transfer = [];
  try {
    let result = null;
    if (type === "init") {
      result = await init(payload);
    } else if (type === "detect") {
      if (!recognizer) throw new Error("Model AI belum siap.");
      result = detect(payload, transfer);
    } else if (type === "close") {
      if (recognizer) recognizer.close();
      recognizer = null;
    }
    self.postMessage({ id, ok: true, result }, transfer);
  } catch (error) {
    if (type === "detect" && payload && payload.bitmap) {
      try {
        payload.bitmap.close();
      } catch {
        // Bitmap sudah ditutup.
      }
    }
    self.postMessage({
      id,
      ok: false,
      error: String((error && error.message) || error || "Worker AI error."),
    });
  }
};
