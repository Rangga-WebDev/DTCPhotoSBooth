/** @format */

"use client";

import { useEffect, useRef } from "react";

// Elemen ikut tertarik sedikit ke arah pointer saat di-hover (desktop saja).
export default function Magnetic({
  children,
  strength = 0.28,
  max = 10,
  className = "",
}) {
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    const fine = window.matchMedia("(pointer: fine)").matches;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!node || !fine || calm) return undefined;

    let raf = 0;
    const clamp = (value) => Math.max(-max, Math.min(max, value));

    function onMove(event) {
      const box = node.getBoundingClientRect();
      const dx = clamp((event.clientX - (box.left + box.width / 2)) * strength);
      const dy = clamp((event.clientY - (box.top + box.height / 2)) * strength);
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        node.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
      });
    }

    function onLeave() {
      cancelAnimationFrame(raf);
      node.style.transform = "";
    }

    node.addEventListener("pointermove", onMove);
    node.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      node.removeEventListener("pointermove", onMove);
      node.removeEventListener("pointerleave", onLeave);
    };
  }, [strength, max]);

  return (
    <span ref={ref} className={`dtc-magnetic ${className}`.trim()}>
      {children}
    </span>
  );
}
