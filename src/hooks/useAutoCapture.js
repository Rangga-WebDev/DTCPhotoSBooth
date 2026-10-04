/** @format */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const HOLD_MS = 1000;
const LOST_GRACE_MS = 350;
const LOCKED_MS = 450;
const COUNTDOWN_SECONDS = 3;
const CAPTURE_MS = 350;
const COOLDOWN_MIN_MS = 800;
const RELEASE_MS = 600;

// IDLE → GESTURE_FOUND → HOLD → LOCKED → COUNTDOWN → CAPTURE → COOLDOWN → IDLE … COMPLETE
export const CAPTURE_STATE = {
  IDLE: "idle",
  FOUND: "found",
  HOLD: "hold",
  LOCKED: "locked",
  COUNTDOWN: "countdown",
  CAPTURE: "capture",
  COOLDOWN: "cooldown",
  COMPLETE: "complete",
};

const POSE_SEQUENCE = [
  {
    id: "peace",
    label: "Peace",
    emoji: "✌️",
  },
  {
    id: "thumbs_up",
    label: "Jempol",
    emoji: "👍",
  },
  {
    id: "call_me",
    label: "Telepon",
    emoji: "🤙",
  },
  {
    id: "heart",
    label: "Bentuk Love",
    emoji: "🫶",
  },
  {
    id: "ily",
    label: "I Love You",
    emoji: "🤟",
  },
  {
    id: "open_palm",
    label: "Tos",
    emoji: "🖐️",
  },
];

export default function useAutoCapture({
  photoCount = 3,
  onCapture,
  onComplete,
}) {
  const total = Math.min(6, Math.max(1, Number(photoCount) || 3));

  const poses = POSE_SEQUENCE.slice(0, total);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [state, setState] = useState(CAPTURE_STATE.IDLE);
  const [countdown, setCountdown] = useState(null);
  const [progress, setProgress] = useState(0);
  const [capturedPhotos, setCapturedPhotos] = useState([]);
  const [gesture, setGesture] = useState(null);

  const stateRef = useRef(CAPTURE_STATE.IDLE);
  const indexRef = useRef(0);
  const photosRef = useRef([]);
  const holdSinceRef = useRef(0);
  const lastSeenRef = useRef(0);
  const cooldownSinceRef = useRef(0);
  const releaseSinceRef = useRef(null);
  const timersRef = useRef([]);

  const onCaptureRef = useRef(onCapture);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCaptureRef.current = onCapture;
    onCompleteRef.current = onComplete;
  }, [onCapture, onComplete]);

  const go = useCallback((next) => {
    stateRef.current = next;
    setState(next);
  }, []);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => {
      clearTimeout(id);
      clearInterval(id);
    });
    timersRef.current = [];
  }, []);

  const later = useCallback((callback, ms) => {
    timersRef.current.push(setTimeout(callback, ms));
  }, []);

  const capture = useCallback(() => {
    clearTimers();
    setCountdown(null);
    go(CAPTURE_STATE.CAPTURE);

    const image = onCaptureRef.current?.();
    setProgress(0);

    if (!image) {
      go(CAPTURE_STATE.IDLE);
      return;
    }

    const photos = [...photosRef.current, image];
    photosRef.current = photos;
    setCapturedPhotos(photos);

    if (photos.length >= total) {
      later(() => {
        go(CAPTURE_STATE.COMPLETE);
        onCompleteRef.current?.(photos);
      }, CAPTURE_MS);
      return;
    }

    later(() => {
      indexRef.current += 1;
      setCurrentIndex(indexRef.current);
      cooldownSinceRef.current = performance.now();
      releaseSinceRef.current = null;
      go(CAPTURE_STATE.COOLDOWN);
    }, CAPTURE_MS);
  }, [clearTimers, go, later, total]);

  const beginCountdown = useCallback(() => {
    go(CAPTURE_STATE.COUNTDOWN);
    setCountdown(COUNTDOWN_SECONDS);

    let remaining = COUNTDOWN_SECONDS;
    timersRef.current.push(
      setInterval(() => {
        remaining -= 1;
        if (remaining <= 0) capture();
        else setCountdown(remaining);
      }, 1000),
    );
  }, [capture, go]);

  const reset = useCallback(() => {
    clearTimers();
    indexRef.current = 0;
    photosRef.current = [];
    releaseSinceRef.current = null;

    setCurrentIndex(0);
    setCapturedPhotos([]);
    setCountdown(null);
    setProgress(0);
    setGesture(null);
    go(CAPTURE_STATE.IDLE);
  }, [clearTimers, go]);

  // Dipanggil tiap frame deteksi dengan gestur yang sudah dihaluskan (gestureSmoothing).
  const processGesture = useCallback(
    ({ gesture: smoothed }) => {
      const now = performance.now();
      const present = Boolean(smoothed?.present);
      const current = stateRef.current;

      if (current === CAPTURE_STATE.COOLDOWN) {
        // Foto berikutnya menunggu hand sign turun, bukan semua tangan hilang.
        if (present) {
          releaseSinceRef.current = null;
          return;
        }
        releaseSinceRef.current ??= now;
        if (
          now - releaseSinceRef.current >= RELEASE_MS &&
          now - cooldownSinceRef.current >= COOLDOWN_MIN_MS
        ) {
          setGesture(null);
          go(CAPTURE_STATE.IDLE);
        }
        return;
      }

      if (current === CAPTURE_STATE.IDLE) {
        if (!present) return;
        holdSinceRef.current = now;
        lastSeenRef.current = now;
        setGesture(smoothed);
        setProgress(0);
        go(CAPTURE_STATE.FOUND);
        return;
      }

      if (current !== CAPTURE_STATE.FOUND && current !== CAPTURE_STATE.HOLD) {
        return;
      }

      if (!present) {
        if (now - lastSeenRef.current > LOST_GRACE_MS) {
          setProgress(0);
          setGesture(null);
          go(CAPTURE_STATE.IDLE);
        }
        return;
      }

      lastSeenRef.current = now;
      setGesture(smoothed);
      const elapsed = now - holdSinceRef.current;
      setProgress(Math.min(100, (elapsed / HOLD_MS) * 100));

      if (elapsed >= HOLD_MS) {
        go(CAPTURE_STATE.LOCKED);
        later(beginCountdown, LOCKED_MS);
      } else if (current === CAPTURE_STATE.FOUND) {
        go(CAPTURE_STATE.HOLD);
      }
    },
    [beginCountdown, go, later],
  );

  useEffect(() => clearTimers, [clearTimers]);

  return {
    poses,
    currentPose: poses[currentIndex],
    currentIndex,
    total,
    state,
    countdown,
    progress,
    gesture,
    capturedPhotos,
    processGesture,
    reset,
  };
}
