/** @format */

"use client";

import { useEffect, useState } from "react";
import { useSessionNumber } from "../../lib/sessionCounter";
import styles from "./landing.module.css";

const CAMERA = {
  check: { value: "Checking", state: undefined },
  ready: { value: "Ready", state: "active" },
  missing: { value: "Not found", state: "error" },
};

const MODEL = {
  check: { value: "Loading", state: undefined },
  ready: { value: "Ready", state: "active" },
  missing: { value: "Offline", state: "error" },
};

// Status nyata: webcam terdeteksi & file model gestur tersedia; tanpa menyalakan kamera.
export default function LiveStatus() {
  const session = useSessionNumber();
  const [camera, setCamera] = useState("check");
  const [model, setModel] = useState("check");

  useEffect(() => {
    let active = true;

    Promise.resolve()
      .then(() => navigator.mediaDevices.enumerateDevices())
      .then((devices) => {
        if (active)
          setCamera(
            devices.some((device) => device.kind === "videoinput")
              ? "ready"
              : "missing",
          );
      })
      .catch(() => active && setCamera("missing"));

    fetch("/models/gesture_recognizer.task", {
      method: "HEAD",
      cache: "no-store",
    })
      .then((response) => active && setModel(response.ok ? "ready" : "missing"))
      .catch(() => active && setModel("missing"));

    return () => {
      active = false;
    };
  }, []);

  const cells = [
    { label: "Cam", status: true, ...CAMERA[camera] },
    { label: "AI / gesture", status: true, ...MODEL[model] },
    { label: "Session", value: session },
    { label: "DTC", value: "2026" },
  ];

  return (
    <dl
      className={`dtc-fade-in ${styles.specs}`}
      aria-label="Status photobooth"
    >
      {cells.map((cell) => (
        <div key={cell.label} className={styles.spec}>
          <dt className="dtc-meta">{cell.label}</dt>
          <dd className="dtc-status dtc-tabular" data-state={cell.state}>
            {cell.status && <i className="dtc-node" />}
            {cell.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
