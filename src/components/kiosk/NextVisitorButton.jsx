/** @format */

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { deletePhotoSession } from "../../lib/photoStorage";
import { setSkipTutorial } from "../../lib/tutorialPreference";
import Icon from "../brand/Icon";
import styles from "./nextVisitor.module.css";

export default function NextVisitorButton({ sessionId, qrReady = false }) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  async function handleNewSession() {
    if (isProcessing) return;
    setIsProcessing(true);
    setError("");

    try {
      // Foto mentah sesi ini dihapus dari browser; file QR di server tidak ikut terhapus.
      if (sessionId) await deletePhotoSession(sessionId);
      try {
        sessionStorage.removeItem("tf-booth-session");
      } catch {
        // sessionStorage tidak wajib.
      }
      // Pengunjung baru selalu melihat tutorial lagi.
      setSkipTutorial(false);
      router.replace("/");
    } catch (err) {
      console.error("New session error:", err);
      setError("Sesi lama gagal dihapus. Coba sekali lagi.");
      setIsProcessing(false);
    }
  }

  return (
    <section className={styles.root} aria-labelledby="next-visitor-title">
      <p className="cia-label cia-kicker">Pengunjung berikutnya</p>
      <h2 id="next-visitor-title" className={styles.title}>
        Gantian, yuk.
      </h2>
      <p className={styles.text}>
        Pastikan pengunjung tadi sudah scan QR dan fotonya terbuka di HP-nya.
      </p>

      {!qrReady && (
        <p className={styles.warning}>QR belum siap. Tunggu sampai QR muncul dulu.</p>
      )}

      {!showConfirm ? (
        <button
          type="button"
          className="cia-btn cia-btn--block"
          onClick={() => setShowConfirm(true)}
        >
          Mulai sesi baru
          <Icon name="arrow" />
        </button>
      ) : (
        <div className={styles.confirm}>
          <h3 className={styles.confirmTitle}>Mulai sesi baru?</h3>
          <p className={styles.text}>
            Foto sesi ini akan dihapus dari browser. Foto yang sudah jadi QR tetap bisa
            dibuka sampai masa aktifnya habis.
          </p>
          <div className={styles.actions}>
            <button
              type="button"
              className="cia-btn"
              onClick={() => setShowConfirm(false)}
              disabled={isProcessing}
            >
              Batal
            </button>
            <button
              type="button"
              className="cia-btn cia-btn--primary"
              onClick={handleNewSession}
              disabled={isProcessing}
            >
              {isProcessing ? "Memulai…" : "Ya, mulai"}
            </button>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="cia-error">
          {error}
        </p>
      )}
    </section>
  );
}
