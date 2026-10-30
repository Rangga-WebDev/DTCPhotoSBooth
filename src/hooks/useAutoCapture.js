/** @format */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { GESTURES } from "../data/gestures";

const HOLD_MS = 1000;
const LOST_GRACE_MS = 450;
const LOCKED_MS = 400;
const COUNTDOWN_SECONDS = 3;
const CAPTURE_MS = 320;
const COOLDOWN_MIN_MS = 700;
const RELEASE_MS = 500;
// Tangan dianggap diam kalau bergerak kurang dari 1,6 × tinggi tangan per detik.
const STEADY_MOTION = 1.6;

// IDLE → FOUND → HOLD → LOCKED → COUNTDOWN → CAPTURE → COOLDOWN → IDLE … COMPLETE
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

// Saran pose per foto; gestur lain dari tutorial tetap dihitung.
const SUGGESTED = ["peace", "thumbs_up", "call_me", "heart", "ily", "open_palm"];
const POSES = SUGGESTED.map((id) => GESTURES.find((gesture) => gesture.id === id));

const { IDLE, FOUND, HOLD, LOCKED, COUNTDOWN, CAPTURE, COOLDOWN, COMPLETE } =
  CAPTURE_STATE;

export default function useAutoCapture({ photoCount = 3, onCapture, onComplete }) {
  const total = Math.min(6, Math.max(1, Number(photoCount) || 3));

  const [currentIndex, setCurrentIndex] = useState(0);
  const [state, setState] = useState(IDLE);
  const [countdown, setCountdown] = useState(null);
  const [progress, setProgress] = useState(0);
  const [steady, setSteady] = useState(true);
  const [captured, setCaptured] = useState([]);

  const stateRef = useRef(IDLE);
  const indexRef = useRef(0);
  const shotsRef = useRef([]);
  const heldRef = useRef(0);
  const tickRef = useRef(0);
  const lastSeenRef = useRef(0);
  const cooldownSinceRef = useRef(0);
  const releaseSinceRef = useRef(null);
  const progressRef = useRef(0);
  const steadyRef = useRef(true);
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

  // Progress hanya dikirim ke React saat berubah ≥ 4% supaya booth tidak re-render tiap frame.
  const showProgress = useCallback((value) => {
    const next = Math.round(value);
    const previous = progressRef.current;
    if (next === previous) return;
    if (next !== 0 && next !== 100 && Math.abs(next - previous) < 4) return;
    progressRef.current = next;
    setProgress(next);
  }, []);

  const showSteady = useCallback((value) => {
    if (steadyRef.current === value) return;
    steadyRef.current = value;
    setSteady(value);
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
    go(CAPTURE);

    const shot = onCaptureRef.current?.();
    heldRef.current = 0;
    showProgress(0);

    if (!shot) {
      go(IDLE);
      return;
    }

    const shots = [...shotsRef.current, shot];
    shotsRef.current = shots;
    setCaptured(shots);

    if (shots.length >= total) {
      later(() => {
        go(COMPLETE);
        onCompleteRef.current?.(shots);
      }, CAPTURE_MS);
      return;
    }

    later(() => {
      indexRef.current += 1;
      setCurrentIndex(indexRef.current);
      cooldownSinceRef.current = performance.now();
      releaseSinceRef.current = null;
      go(COOLDOWN);
    }, CAPTURE_MS);
  }, [clearTimers, go, later, showProgress, total]);

  const beginCountdown = useCallback(() => {
    go(COUNTDOWN);
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
    shotsRef.current = [];
    heldRef.current = 0;
    releaseSinceRef.current = null;

    setCurrentIndex(0);
    setCaptured([]);
    setCountdown(null);
    showProgress(0);
    showSteady(true);
    go(IDLE);
  }, [clearTimers, go, showProgress, showSteady]);

  // Dipanggil tiap hasil deteksi dengan gestur yang sudah dihaluskan.
  const processGesture = useCallback(
    ({ gesture, active }) => {
      const now = performance.now();
      const present = Boolean(gesture?.present);
      const current = stateRef.current;

      if (current === COOLDOWN) {
        // Foto berikutnya menunggu hand sign turun dulu.
        if (present) {
          releaseSinceRef.current = null;
          return;
        }
        releaseSinceRef.current ??= now;
        if (
          now - releaseSinceRef.current >= RELEASE_MS &&
          now - cooldownSinceRef.current >= COOLDOWN_MIN_MS
        ) {
          go(IDLE);
        }
        return;
      }

      if (current === IDLE) {
        if (!present) return;
        heldRef.current = 0;
        tickRef.current = now;
        lastSeenRef.current = now;
        showSteady(true);
        showProgress(0);
        go(FOUND);
        return;
      }

      if (current !== FOUND && current !== HOLD) return;

      const dt = Math.min(200, now - tickRef.current);
      tickRef.current = now;

      if (!present) {
        if (now - lastSeenRef.current > LOST_GRACE_MS) {
          heldRef.current = 0;
          showProgress(0);
          showSteady(true);
          go(IDLE);
        }
        return;
      }

      lastSeenRef.current = now;
      // Tangan yang masih diayunkan menahan progress (tidak mereset), supaya foto tidak blur.
      const isSteady = !active || active.motion < STEADY_MOTION;
      showSteady(isSteady);
      if (isSteady) heldRef.current += dt;
      showProgress(Math.min(100, (heldRef.current / HOLD_MS) * 100));

      if (heldRef.current >= HOLD_MS) {
        go(LOCKED);
        later(beginCountdown, LOCKED_MS);
      } else if (current === FOUND) {
        go(HOLD);
      }
    },
    [beginCountdown, go, later, showProgress, showSteady],
  );

  useEffect(() => clearTimers, [clearTimers]);

  return {
    currentPose: POSES[Math.min(currentIndex, POSES.length - 1)],
    currentIndex,
    total,
    state,
    countdown,
    progress,
    steady,
    captured,
    processGesture,
    reset,
  };
}
