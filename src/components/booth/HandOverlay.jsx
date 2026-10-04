/** @format */

"use client";

import { useEffect, useImperativeHandle, useRef } from "react";

import styles from "./booth.module.css";

const BONES = [
  [0, 1, 2, 3, 4],
  [0, 5, 6, 7, 8],
  [5, 9, 10, 11, 12],
  [9, 13, 14, 15, 16],
  [13, 17, 18, 19, 20],
  [0, 17],
];
const TIPS = new Set([4, 8, 12, 16, 20]);
const PAPER = "rgba(247, 249, 251, 0.92)";
const CYAN = "#12c8f4";

function brackets(ctx, left, top, right, bottom, size) {
  ctx.beginPath();
  ctx.moveTo(left, top + size);
  ctx.lineTo(left, top);
  ctx.lineTo(left + size, top);
  ctx.moveTo(right - size, top);
  ctx.lineTo(right, top);
  ctx.lineTo(right, top + size);
  ctx.moveTo(right, bottom - size);
  ctx.lineTo(right, bottom);
  ctx.lineTo(right - size, bottom);
  ctx.moveTo(left + size, bottom);
  ctx.lineTo(left, bottom);
  ctx.lineTo(left, bottom - size);
  ctx.stroke();
}

// Kerangka tangan live di atas video; digambar langsung ke canvas (bukan state React).
export default function HandOverlay({ ref, video }) {
  const canvasRef = useRef(null);
  const sizeRef = useRef({ width: 0, height: 0, ratio: 1 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const observer = new ResizeObserver(([entry]) => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const { width, height } = entry.contentRect;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      sizeRef.current = { width, height, ratio };
    });

    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      draw(hands, { active = false, progress = 0, roi = null } = {}) {
        const ctx = canvasRef.current?.getContext("2d");
        if (!ctx) return;

        const { width, height, ratio } = sizeRef.current;
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        ctx.clearRect(0, 0, width, height);
        if (!video?.videoWidth) return;

        // Sama dengan object-fit: cover + cermin di elemen video.
        const scale = Math.max(
          width / video.videoWidth,
          height / video.videoHeight,
        );
        const offsetX = (width - video.videoWidth * scale) / 2;
        const offsetY = (height - video.videoHeight * scale) / 2;
        const toScreen = (x, y) => [
          offsetX + (1 - x) * video.videoWidth * scale,
          offsetY + y * video.videoHeight * scale,
        ];
        const line = active ? CYAN : PAPER;

        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.font = "500 11px 'IBM Plex Mono', monospace";

        if (roi && roi.mode !== "wide") {
          const [right, top] = toScreen(roi.rect.x, roi.rect.y);
          const [left, bottom] = toScreen(
            roi.rect.x + roi.rect.w,
            roi.rect.y + roi.rect.h,
          );
          ctx.save();
          ctx.setLineDash([6, 6]);
          ctx.strokeStyle = "rgba(18, 200, 244, 0.6)";
          ctx.lineWidth = 1;
          ctx.strokeRect(left, top, right - left, bottom - top);
          ctx.restore();
          ctx.fillStyle = "rgba(18, 200, 244, 0.85)";
          ctx.fillText(`ROI ${roi.zoom}×`, left + 8, top + 18);
        }

        if (!hands?.length) return;

        hands.forEach((landmarks, handIndex) => {
          if (!landmarks?.length) return;

          const points = landmarks.map((point) => toScreen(point.x, point.y));

          ctx.strokeStyle = line;
          ctx.lineWidth = 2;
          BONES.forEach((chain) => {
            ctx.beginPath();
            chain.forEach((index, step) => {
              const [x, y] = points[index];
              if (step === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            });
            ctx.stroke();
          });

          points.forEach(([x, y], index) => {
            ctx.beginPath();
            ctx.fillStyle = TIPS.has(index) ? CYAN : PAPER;
            ctx.arc(x, y, TIPS.has(index) ? 4.5 : 2.5, 0, Math.PI * 2);
            ctx.fill();
          });

          const xs = points.map(([x]) => x);
          const ys = points.map(([, y]) => y);
          const left = Math.min(...xs) - 16;
          const right = Math.max(...xs) + 16;
          const top = Math.min(...ys) - 16;
          const bottom = Math.max(...ys) + 16;

          ctx.lineWidth = 1.5;
          brackets(ctx, left, top, right, bottom, 14);
          ctx.fillStyle = line;
          ctx.fillText(
            `HAND ${String(handIndex + 1).padStart(2, "0")}`,
            left,
            top - 8,
          );

          if (active && progress > 0) {
            ctx.fillStyle = CYAN;
            ctx.fillRect(
              left,
              bottom + 8,
              ((right - left) * Math.min(progress, 100)) / 100,
              3,
            );
          }
        });
      },
    }),
    [video],
  );

  return (
    <canvas ref={canvasRef} className={styles.overlay} aria-hidden="true" />
  );
}
