/** @format */

"use client";

import { useEffect, useRef, useState } from "react";

import { recognizeCustomGestures } from "../lib/customGestures";
import {
  detectGesture,
  initializeGestureAI,
  warmUpGestureAI,
} from "../lib/gestureRecognizer";
import { createGestureSmoother } from "../lib/gestureSmoothing";
import { boundsOf, createRoiTracker } from "../lib/handRoi";

const MIN_CONFIDENCE = 0.65;
// Lebar canvas inferensi, terpisah dari resolusi kamera; turun satu tingkat kalau laptop kewalahan.
const TIERS = [960, 768, 640];
const MIN_INTERVAL = 50;
const MAX_INTERVAL = 125;
const SLOW_MS = 55;
const FAST_MS = 22;
const TIER_COOLDOWN = 3000;

// Loop deteksi tanpa UI: crop ROI → MediaPipe → gestur kustom → smoothing.
export default function useGestureStream(video, onResult) {
  const [model, setModel] = useState({ status: "loading", error: "" });
  const callbackRef = useRef(onResult);

  useEffect(() => {
    callbackRef.current = onResult;
  }, [onResult]);

  // Model mulai dimuat bersamaan dengan kamera, bukan menunggu video siap.
  useEffect(() => {
    warmUpGestureAI();
  }, []);

  useEffect(() => {
    if (!video) return undefined;

    let cancelled = false;
    let raf = 0;
    let lastDetection = 0;
    let lastVideoTime = -1;
    let cost = 30;
    let frameGap = 66;
    let tier = 0;
    let tierChanged = 0;

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { alpha: false });
    const tracker = createRoiTracker();
    const smoother = createGestureSmoother();

    function loop(timestamp) {
      if (cancelled) return;
      raf = requestAnimationFrame(loop);

      const interval = Math.min(
        MAX_INTERVAL,
        Math.max(MIN_INTERVAL, cost * 2.2),
      );
      if (timestamp - lastDetection < interval) return;
      if (video.readyState < 2 || video.paused || !video.videoWidth) return;
      if (video.currentTime === lastVideoTime) return;

      frameGap += (timestamp - lastDetection - frameGap) * 0.2;
      lastDetection = timestamp;
      lastVideoTime = video.currentTime;

      const roi = tracker.current();
      const width = TIERS[tier];
      const height = Math.round((width * video.videoHeight) / video.videoWidth);
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      try {
        context.drawImage(
          video,
          roi.rect.x * video.videoWidth,
          roi.rect.y * video.videoHeight,
          roi.rect.w * video.videoWidth,
          roi.rect.h * video.videoHeight,
          0,
          0,
          width,
          height,
        );

        const started = performance.now();
        const result = detectGesture(canvas, timestamp, roi.rect);
        cost += (performance.now() - started - cost) * 0.2;
        if (!result) return;

        if (timestamp - tierChanged > TIER_COOLDOWN) {
          if (cost > SLOW_MS && tier < TIERS.length - 1) {
            tier += 1;
            tierChanged = timestamp;
          } else if (cost < FAST_MS && tier > 0) {
            tier -= 1;
            tierChanged = timestamp;
          }
        }

        const hands = recognizeCustomGestures(result.hands).filter(
          (hand) => hand.confidence >= MIN_CONFIDENCE,
        );
        tracker.update(timestamp, boundsOf(result.hands));

        callbackRef.current?.({
          hands,
          handCount: hands.length,
          timestamp,
          landmarks: result.hands.map((hand) => hand.landmarks),
          gesture: smoother.push(hands, timestamp),
          roi,
          stats: {
            fps: Math.round(1000 / frameGap),
            ms: Math.round(cost),
            width,
          },
        });
      } catch (detectionError) {
        console.error("Gesture detection error:", detectionError);
      }
    }

    initializeGestureAI()
      .then(() => {
        if (cancelled) return;
        setModel({ status: "ready", error: "" });
        raf = requestAnimationFrame(loop);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("MediaPipe initialization error:", error);
        setModel({
          status: "error",
          error: error.message || "Model AI gagal dimuat.",
        });
      });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [video]);

  return video ? model : { status: "idle", error: "" };
}
