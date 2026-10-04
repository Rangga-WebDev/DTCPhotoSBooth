/** @format */

import { FilesetResolver, GestureRecognizer } from "@mediapipe/tasks-vision";

// WASM disalin ke public/ oleh scripts/copy-mediapipe-wasm.mjs (predev/prebuild).
const LOCAL_WASM = "/mediapipe/wasm";
const MAX_HANDS = 4;
const FULL_FRAME = { x: 0, y: 0, w: 1, h: 1 };

let recognizer = null;
let initializationPromise = null;
let wasmSource = null;

async function resolveWasmBase() {
  try {
    const response = await fetch(`${LOCAL_WASM}/vision_wasm_internal.wasm`, {
      method: "HEAD",
    });
    if (response.ok) {
      wasmSource = "local";
      return LOCAL_WASM;
    }
  } catch {
    // Lanjut ke CDN.
  }

  wasmSource = "cdn";
  return `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${process.env.NEXT_PUBLIC_MEDIAPIPE_VERSION}/wasm`;
}

export function getGestureRuntime() {
  return { wasm: wasmSource, maxHands: MAX_HANDS };
}

// Inisialisasi AI hanya satu kali
export async function initializeGestureAI() {
  if (recognizer) {
    return recognizer;
  }

  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    // Memastikan kode hanya dijalankan di browser
    if (typeof window === "undefined") {
      throw new Error("Gesture AI hanya dapat dijalankan di browser.");
    }

    const vision = await FilesetResolver.forVisionTasks(
      await resolveWasmBase(),
    );

    recognizer = await GestureRecognizer.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: "/models/gesture_recognizer.task",
        delegate: "CPU",
      },

      runningMode: "VIDEO",

      numHands: MAX_HANDS,

      minHandDetectionConfidence: 0.5,
      minHandPresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    return recognizer;
  })();

  try {
    return await initializationPromise;
  } catch (error) {
    initializationPromise = null;
    throw error;
  }
}

// Pemanasan dari tutorial/landing: navigasi ke booth tidak me-reload modul,
// jadi model yang sudah siap langsung dipakai kamera.
export function warmUpGestureAI() {
  if (typeof window === "undefined" || recognizer || initializationPromise) {
    return;
  }
  initializeGestureAI().catch(() => {});
}

// Nama gestur bawaan MediaPipe menjadi format aplikasi
const gestureNames = {
  Thumb_Up: {
    id: "thumbs_up",
    label: "Jempol",
    emoji: "👍",
  },

  Victory: {
    id: "peace",
    label: "Peace",
    emoji: "✌️",
  },

  ILoveYou: {
    id: "ily",
    label: "I Love You",
    emoji: "🤟",
  },

  Open_Palm: {
    id: "open_palm",
    label: "Tos",
    emoji: "🖐️",
  },

  Closed_Fist: {
    id: "fist",
    label: "Kepal Tangan",
    emoji: "✊",
  },

  Pointing_Up: {
    id: "pointing_up",
    label: "Tunjuk ke Atas",
    emoji: "☝️",
  },

  Thumb_Down: {
    id: "thumbs_down",
    label: "Jempol Terbalik",
    emoji: "👎",
  },
};

// Memproses satu frame (video atau canvas ROI) menjadi hasil deteksi.
// roi = bagian frame penuh yang ada di source; landmark dipetakan balik ke frame penuh.
export function detectGesture(source, timestamp, roi = FULL_FRAME) {
  if (!recognizer || !source) {
    return null;
  }

  const result = recognizer.recognizeForVideo(source, timestamp);

  const hands = [];

  for (let i = 0; i < result.gestures.length; i++) {
    const prediction = result.gestures[i]?.[0];

    if (!prediction) {
      continue;
    }

    const gesture = gestureNames[prediction.categoryName];

    hands.push({
      id: gesture?.id || "unknown",
      label: gesture?.label || prediction.categoryName,
      emoji: gesture?.emoji || "✋",
      confidence: prediction.score,

      // 21 titik koordinat tangan, dalam koordinat frame penuh
      landmarks: (result.landmarks?.[i] || []).map((point) => ({
        ...point,
        x: roi.x + point.x * roi.w,
        y: roi.y + point.y * roi.h,
      })),

      handedness: result.handedness?.[i]?.[0]?.categoryName || "Unknown",
    });
  }

  return {
    hands,
    handCount: hands.length,
    timestamp,
  };
}

// Membersihkan model saat benar-benar tidak dibutuhkan
export function disposeGestureAI() {
  if (recognizer) {
    recognizer.close();
    recognizer = null;
  }

  initializationPromise = null;
}
