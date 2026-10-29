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
const WHITE = "rgba(255, 255, 255, 0.9)";
const RED = "#F00C1C";

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

// Kerangka tangan live di atas video; digambar langsung ke canvas, bukan lewat state React.
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
      // hands: tangan terlacak (pakai titik yang sudah dihaluskan); activeId = tangan pemberi gestur.
      draw(hands, { activeId = null, armed = false, progress = 0, roi = null } = {}) {
        const ctx = canvasRef.current?.getContext("2d");
        if (!ctx) return;

        const { width, height, ratio } = sizeRef.current;
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        ctx.clearRect(0, 0, width, height);
        if (!video?.videoWidth) return;

        // Sama dengan object-fit: cover + cermin di elemen video.
        const scale = Math.max(width / video.videoWidth, height / video.videoHeight);
        const offsetX = (width - video.videoWidth * scale) / 2;
        const offsetY = (height - video.videoHeight * scale) / 2;
        const toScreen = (x, y) => [
          offsetX + (1 - x) * video.videoWidth * scale,
          offsetY + y * video.videoHeight * scale,
        ];

        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.font = "600 13px 'Barlow Condensed', sans-serif";

        // Kotak zoom hanya saat mengikuti tangan jauh; pemindaian saat kosong tidak digambar
        // supaya layar tidak berkedip.
        if (roi?.mode === "follow") {
          const [right, top] = toScreen(roi.rect.x, roi.rect.y);
          const [left, bottom] = toScreen(roi.rect.x + roi.rect.w, roi.rect.y + roi.rect.h);
          ctx.save();
          ctx.setLineDash([8, 8]);
          ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
          ctx.lineWidth = 1;
          ctx.strokeRect(left, top, right - left, bottom - top);
          ctx.restore();
          ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
          ctx.fillText(`ZOOM ${roi.zoom}×`, left + 10, top + 20);
        }

        hands?.forEach((hand) => {
          const source = hand.smooth ?? hand.points;
          if (!source?.length) return;

          const active = armed && hand.trackId === activeId;
          const line = active ? RED : WHITE;
          const points = source.map((point) => toScreen(point.x, point.y));

          ctx.strokeStyle = line;
          ctx.lineWidth = active ? 3 : 2;
          BONES.forEach((chain) => {
            ctx.beginPath();
            chain.forEach((index, step) => {
              const [x, y] = points[index];
              if (step === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            });
            ctx.stroke();
          });

          ctx.fillStyle = WHITE;
          points.forEach(([x, y], index) => {
            if (TIPS.has(index)) return;
            ctx.beginPath();
            ctx.arc(x, y, 2.5, 0, Math.PI * 2);
            ctx.fill();
          });
          ctx.fillStyle = RED;
          points.forEach(([x, y], index) => {
            if (!TIPS.has(index)) return;
            ctx.beginPath();
            ctx.arc(x, y, 4.5, 0, Math.PI * 2);
            ctx.fill();
          });

          let left = Infinity;
          let right = -Infinity;
          let top = Infinity;
          let bottom = -Infinity;
          points.forEach(([x, y]) => {
            left = Math.min(left, x);
            right = Math.max(right, x);
            top = Math.min(top, y);
            bottom = Math.max(bottom, y);
          });
          left -= 16;
          right += 16;
          top -= 16;
          bottom += 16;

          ctx.lineWidth = 2;
          brackets(ctx, left, top, right, bottom, 16);
          if (hand.gesture?.label) {
            ctx.fillStyle = line;
            ctx.fillText(hand.gesture.label.toUpperCase(), left, top - 8);
          }

          if (active && progress > 0) {
            ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
            ctx.fillRect(left, bottom + 8, right - left, 4);
            ctx.fillStyle = RED;
            ctx.fillRect(left, bottom + 8, ((right - left) * Math.min(progress, 100)) / 100, 4);
          }
        });
      },
    }),
    [video],
  );

  return <canvas ref={canvasRef} className={styles.overlay} aria-hidden="true" />;
}
