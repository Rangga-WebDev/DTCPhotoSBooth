/** @format */

"use client";

import { useEffect, useState } from "react";

import styles from "./landing.module.css";

const LABEL = {
  check: { text: "Memeriksa", state: "warn" },
  ready: { text: "Siap", state: "ok" },
  missing: { text: "Tidak ada", state: "error" },
};

// Cek ringan tanpa menyalakan kamera: webcam terdeteksi & file model AI tersedia.
export default function LiveStatus() {
  const [camera, setCamera] = useState("check");
  const [model, setModel] = useState("check");

  useEffect(() => {
    let active = true;

    Promise.resolve()
      .then(() => navigator.mediaDevices.enumerateDevices())
      .then((devices) => {
        if (active) {
          setCamera(devices.some((device) => device.kind === "videoinput") ? "ready" : "missing");
        }
      })
      .catch(() => active && setCamera("missing"));

    fetch("/models/gesture_recognizer.task", { method: "HEAD", cache: "no-store" })
      .then((response) => active && setModel(response.ok ? "ready" : "missing"))
      .catch(() => active && setModel("missing"));

    return () => {
      active = false;
    };
  }, []);

  return (
    <ul className={styles.status} aria-label="Status photobooth">
      <li className="cia-status" data-state={LABEL[camera].state}>
        Kamera · {LABEL[camera].text}
      </li>
      <li className="cia-status" data-state={LABEL[model].state}>
        AI gestur · {LABEL[model].text}
      </li>
    </ul>
  );
}
