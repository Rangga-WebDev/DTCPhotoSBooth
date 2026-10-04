/** @format */

"use client";

import { useEffect, useState } from "react";
import styles from "./design-system.module.css";

const COLUMNS = Array.from({ length: 12 }, (_, index) => index);

function restart(node) {
  node.getAnimations({ subtree: true }).forEach((animation) => {
    animation.cancel();
    animation.play();
  });
}

export default function SpecControls() {
  const [showGrid, setShowGrid] = useState(false);

  useEffect(() => {
    function onKeyDown(event) {
      if (
        event.key.toLowerCase() !== "g" ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey
      ) {
        return;
      }
      if (
        event.target instanceof HTMLElement &&
        event.target.closest("input, textarea, select")
      ) {
        return;
      }
      setShowGrid((value) => !value);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Demo motion ditahan di frame awal, baru diputar saat masuk layar.
  useEffect(() => {
    const demos = [...document.querySelectorAll("[data-motion-demo]")];

    demos.forEach((node) =>
      node.getAnimations({ subtree: true }).forEach((animation) => {
        animation.pause();
        animation.currentTime = 0;
      }),
    );

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          restart(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.35 },
    );

    demos.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {showGrid && (
        <div className="dtc-grid-overlay" aria-hidden="true">
          {COLUMNS.map((column) => (
            <span key={column} />
          ))}
        </div>
      )}

      <div
        className={styles.controls}
        role="toolbar"
        aria-label="Alat bantu design system"
      >
        <button
          type="button"
          className="dtc-btn"
          aria-pressed={showGrid}
          onClick={() => setShowGrid((value) => !value)}
        >
          <span>Grid {showGrid ? "on" : "off"}</span>
          <span className="dtc-btn__arrow dtc-micro">G</span>
        </button>
        <button
          type="button"
          className="dtc-btn"
          onClick={() =>
            document.querySelectorAll("[data-motion-demo]").forEach(restart)
          }
        >
          <span>Replay motion</span>
        </button>
      </div>
    </>
  );
}
