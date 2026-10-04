/** @format */

"use client";

import { useEffect, useRef } from "react";

const INTERACTIVE = "a, button, label, [data-cursor]";

function pad(value) {
  return String(Math.max(0, Math.round(value))).padStart(4, "0");
}

// Crosshair + koordinat piksel; hanya aktif di pointer presisi dan tanpa reduced motion.
export default function CustomCursor() {
  const crossRef = useRef(null);
  const frameRef = useRef(null);
  const labelRef = useRef(null);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Simpan node sekarang: saat unmount, ref sudah null sebelum cleanup effect jalan.
    const cross = crossRef.current;
    const frameNode = frameRef.current;
    const label = labelRef.current;
    if (!fine || calm || !cross || !frameNode || !label) return undefined;

    const root = document.documentElement;
    const point = { x: -100, y: -100 };
    const frame = { x: -100, y: -100 };
    let raf = 0;
    let hoverLabel = "";

    function render() {
      frame.x += (point.x - frame.x) * 0.28;
      frame.y += (point.y - frame.y) * 0.28;
      cross.style.transform = `translate3d(${point.x}px, ${point.y}px, 0)`;
      frameNode.style.transform = `translate3d(${frame.x}px, ${frame.y}px, 0)`;
      label.textContent = hoverLabel || `X ${pad(point.x)} · Y ${pad(point.y)}`;

      const settled =
        Math.abs(point.x - frame.x) < 0.3 && Math.abs(point.y - frame.y) < 0.3;
      raf = settled ? 0 : requestAnimationFrame(render);
    }

    function onMove(event) {
      point.x = event.clientX;
      point.y = event.clientY;
      // Kursor bawaan baru diganti setelah mouse benar-benar bergerak.
      if (!root.classList.contains("dtc-cursor-on")) {
        frame.x = point.x;
        frame.y = point.y;
        root.classList.add("dtc-cursor-on");
      }
      if (!raf) raf = requestAnimationFrame(render);
    }

    function onOver(event) {
      const target =
        event.target instanceof Element
          ? event.target.closest(INTERACTIVE)
          : null;
      hoverLabel = target ? target.getAttribute("data-cursor") || "" : "";
      root.classList.toggle("dtc-cursor-hover", Boolean(target));
      if (!raf) raf = requestAnimationFrame(render);
    }

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      root.classList.remove("dtc-cursor-on", "dtc-cursor-hover");
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
    };
  }, []);

  return (
    <div className="dtc-cursor" aria-hidden="true">
      <span className="dtc-cursor__frame" ref={frameRef}>
        <i className="dtc-corners" />
      </span>
      <span className="dtc-cursor__cross" ref={crossRef}>
        <span className="dtc-cursor__label" ref={labelRef} />
      </span>
    </div>
  );
}
