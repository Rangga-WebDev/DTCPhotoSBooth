/** @format */

"use client";

import { useEffect, useRef, useState } from "react";

import {
  initializeGestureAI,
  detectGesture,
} from "../../lib/gestureRecognizer";

import { recognizeCustomGestures } from "../../lib/customGestures";

const DETECTION_INTERVAL = 1000 / 15;
const MIN_CONFIDENCE = 0.65;

export default function GestureDetector({ videoElement, onGestureDetected }) {
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  const [detectedHands, setDetectedHands] = useState([]);

  const animationRef = useRef(null);
  const lastDetectionRef = useRef(0);
  const lastVideoTimeRef = useRef(-1);
  const callbackRef = useRef(onGestureDetected);

  // Pastikan callback terbaru tetap digunakan
  // tanpa mengulang inisialisasi AI.
  useEffect(() => {
    callbackRef.current = onGestureDetected;
  }, [onGestureDetected]);

  useEffect(() => {
    if (!videoElement) return;

    let cancelled = false;

    async function startDetection() {
      try {
        setStatus("loading");
        setError("");

        await initializeGestureAI();

        if (cancelled) return;

        setStatus("ready");

        function detectionLoop(timestamp) {
          if (cancelled) return;

          animationRef.current = requestAnimationFrame(detectionLoop);

          if (timestamp - lastDetectionRef.current < DETECTION_INTERVAL) {
            return;
          }

          if (videoElement.readyState < 2 || videoElement.paused) {
            return;
          }

          // Hindari memproses frame video yang sama.
          if (videoElement.currentTime === lastVideoTimeRef.current) {
            return;
          }

          lastDetectionRef.current = timestamp;
          lastVideoTimeRef.current = videoElement.currentTime;

          try {
            const result = detectGesture(videoElement, timestamp);

            if (!result) return;

            const recognizedHands = recognizeCustomGestures(result.hands);

            const validHands = recognizedHands.filter(
              (hand) => hand.confidence >= MIN_CONFIDENCE,
            );

            setDetectedHands(validHands);

            callbackRef.current?.({
              hands: validHands,
              handCount: validHands.length,
              timestamp,
            });
          } catch (detectionError) {
            console.error("Gesture detection error:", detectionError);
          }
        }

        animationRef.current = requestAnimationFrame(detectionLoop);
      } catch (initializationError) {
        if (cancelled) return;

        console.error("MediaPipe initialization error:", initializationError);

        setStatus("error");
        setError(initializationError.message || "Model AI gagal dimuat.");
      }
    }

    startDetection();

    return () => {
      cancelled = true;

      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }

      // Model AI tidak ditutup di sini.
      // Instance digunakan kembali selama aplikasi berjalan.
    };
  }, [videoElement]);

  return (
    <section className="gesture-detector">
      <div className="gesture-detector-header">
        <div>
          <span className="gesture-detector-eyebrow">PEMBACA GESTUR</span>

          <h2>Gestur tanganmu</h2>
        </div>

        <span
          className={`gesture-ai-status ${status === "ready" ? "active" : ""}`}
        >
          {status === "loading" && "◌ MEMUAT AI"}
          {status === "ready" && "● AI AKTIF"}
          {status === "error" && "● AI GAGAL"}
        </span>
      </div>

      {status === "loading" && (
        <div className="gesture-loading">
          <h3>AI lagi disiapkan…</h3>

          <p>Tunggu sebentar, model pembaca gestur sedang dimuat.</p>
        </div>
      )}

      {status === "error" && (
        <div className="gesture-error">
          <h3>AI gagal jalan</h3>

          <p>{error}</p>
        </div>
      )}

      {status === "ready" && (
        <div className="gesture-results">
          {detectedHands.length === 0 ? (
            <div className="gesture-empty">
              <span>🖐️</span>

              <h3>Angkat tangan!</h3>

              <p>Tunjukkan tangan ke kamera, nanti gesturnya kebaca di sini.</p>
            </div>
          ) : (
            <div className="gesture-hands">
              {detectedHands.map((hand, index) => (
                <div className="gesture-result-card" key={index}>
                  <div className="gesture-emoji">{hand.emoji}</div>

                  <div className="gesture-result-info">
                    <span>TANGAN {index + 1}</span>

                    <h3>{hand.label}</h3>

                    <p>AI yakin {Math.round(hand.confidence * 100)}%</p>
                  </div>

                  <div className="gesture-confidence">
                    <div
                      style={{
                        width: `${hand.confidence * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="gesture-supported">
            <span>COBA GESTUR INI:</span>

            <div>
              <span>👍</span>
              <span>✌️</span>
              <span>🤟</span>
              <span>🖐️</span>
              <span>✊</span>
              <span>☝️</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
