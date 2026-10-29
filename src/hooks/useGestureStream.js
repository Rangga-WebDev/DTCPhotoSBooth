/** @format */

"use client";

import { useEffect, useRef, useState } from "react";

import { recognizeHands } from "../lib/gestureClassifier";
import {
  loadGestureEngine,
  resetGestureEngine,
  warmUpGestureEngine,
} from "../lib/gestureEngine";
import { createGestureSmoother } from "../lib/gestureSmoothing";
import { boundsOf, createRoiTracker } from "../lib/handRoi";
import { createHandTracker } from "../lib/handTracker";

// Lebar frame analysis tetap: model MediaPipe me-resize sendiri, jadi resolusi lebih kecil
// hampir tidak mempercepat inferensi tapi membuat tangan jauh makin sulit terbaca.
const ANALYSIS_WIDTH = 960;
// Paling sering ± 22 kali per detik saat ada tangan; saat kosong cukup ± 6 kali per detik
// supaya CPU laptop tetap dingin dan video tetap mulus.
const ACTIVE_INTERVAL = 45;
const IDLE_INTERVAL = 110;
const IDLE_AFTER_MS = 2500;
const LIGHT_EVERY = 5;
const MAX_ERRORS = 8;

function toPoints(data, rect) {
  if (!data) return null;
  const points = [];
  for (let i = 0; i < data.length; i += 3) {
    points.push(
      rect
        ? {
            x: rect.x + data[i] * rect.w,
            y: rect.y + data[i + 1] * rect.h,
            z: data[i + 2] * rect.w,
          }
        : { x: data[i], y: data[i + 1], z: data[i + 2] },
    );
  }
  return points;
}

// Landmark hasil crop ROI dipetakan balik ke koordinat frame penuh (0–1).
function unpack(raw, rect) {
  return raw
    .map((hand) => ({
      points: toPoints(hand.landmarks, rect),
      world: toPoints(hand.world),
      handedness: hand.handedness,
      category: hand.category,
      score: hand.score,
    }))
    .filter((hand) => hand.points?.length === 21);
}

// Loop deteksi tanpa UI: frame kamera → crop ROI → AI (worker) → klasifikasi → smoothing.
export default function useGestureStream(video, onResult) {
  const [model, setModel] = useState({
    status: "loading",
    error: "",
    backend: null,
  });
  const callbackRef = useRef(onResult);

  useEffect(() => {
    callbackRef.current = onResult;
  }, [onResult]);

  // Model mulai dimuat bersamaan dengan kamera, bukan menunggu video siap.
  useEffect(() => {
    warmUpGestureEngine();
  }, []);

  useEffect(() => {
    if (!video) return undefined;

    let cancelled = false;
    let engine = null;
    let busy = false;
    let handle = 0;
    let lastStart = 0;
    let frameGap = 66;
    let cost = 30;
    let lastHandsAt = 0;
    let frames = 0;
    let errors = 0;
    let light = null;

    const frameSynced = typeof video.requestVideoFrameCallback === "function";
    const roiTracker = createRoiTracker();
    const handTracker = createHandTracker();
    const smoother = createGestureSmoother();

    function schedule() {
      if (cancelled) return;
      handle = frameSynced
        ? video.requestVideoFrameCallback(tick)
        : requestAnimationFrame(tick);
    }

    function handleResult(raw, roi, now, width) {
      cost += (raw.cost - cost) * 0.2;
      if (raw.hands.length) lastHandsAt = now;
      if (typeof raw.light === "number") {
        light = light === null ? raw.light : light + (raw.light - light) * 0.4;
      }

      const aspect = video.videoWidth / video.videoHeight || 16 / 9;
      const hands = handTracker.update(unpack(raw.hands, roi.rect), now, aspect);
      const candidates = recognizeHands(hands, aspect);
      roiTracker.update(now, boundsOf(hands));
      const gesture = smoother.push(candidates, now);

      callbackRef.current?.({
        hands,
        gesture,
        active: hands.find((hand) => hand.trackId === gesture.trackId) ?? null,
        roi,
        light,
        timestamp: now,
        stats: {
          fps: Math.round(1000 / frameGap),
          ms: Math.round(cost),
          width,
          backend: engine?.backend ?? null,
        },
      });
    }

    async function recover() {
      engine = null;
      errors = 0;
      resetGestureEngine();
      setModel({ status: "loading", error: "", backend: null });
      try {
        const next = await loadGestureEngine();
        if (cancelled) return;
        engine = next;
        setModel({ status: "ready", error: "", backend: next.backend });
      } catch (error) {
        if (cancelled) return;
        setModel({
          status: "error",
          error: error.message || "Model AI gagal dimuat.",
          backend: null,
        });
      }
    }

    function tick() {
      if (cancelled) return;
      const now = performance.now();
      const interval = now - lastHandsAt > IDLE_AFTER_MS ? IDLE_INTERVAL : ACTIVE_INTERVAL;
      if (
        !engine ||
        busy ||
        video.readyState < 2 ||
        !video.videoWidth ||
        now - lastStart < interval
      ) {
        schedule();
        return;
      }

      if (lastStart) frameGap += (now - lastStart - frameGap) * 0.2;
      lastStart = now;
      busy = true;
      frames += 1;

      const roi = roiTracker.current();
      const width = ANALYSIS_WIDTH;
      const height = Math.round((width * video.videoHeight) / video.videoWidth);

      engine
        .detect(video, now, roi.rect, width, height, frames % LIGHT_EVERY === 1)
        .then((raw) => {
          errors = 0;
          if (!cancelled) handleResult(raw, roi, now, width);
        })
        .catch((error) => {
          if (cancelled) return;
          errors += 1;
          console.error("[CIA] Deteksi gestur gagal:", error);
          if (errors >= MAX_ERRORS) recover();
        })
        .finally(() => {
          busy = false;
          schedule();
        });
    }

    loadGestureEngine()
      .then((loaded) => {
        if (cancelled) return;
        engine = loaded;
        setModel({ status: "ready", error: "", backend: loaded.backend });
        schedule();
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("[CIA] Model AI gagal dimuat:", error);
        setModel({
          status: "error",
          error: error.message || "Model AI gagal dimuat.",
          backend: null,
        });
      });

    return () => {
      cancelled = true;
      if (frameSynced) video.cancelVideoFrameCallback?.(handle);
      else cancelAnimationFrame(handle);
    };
  }, [video]);

  return video ? model : { status: "idle", error: "", backend: null };
}
