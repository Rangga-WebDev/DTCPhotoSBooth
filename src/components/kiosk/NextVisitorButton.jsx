/** @format */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { deletePhotoSession } from "../../lib/photoStorage";
import { setSkipTutorial } from "../../lib/tutorialPreference";
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
      // Bersihkan sesi lokal sebelumnya.
      // Foto yang sudah diunggah ke server
      // tidak ikut dihapus.
      if (sessionId) {
        await deletePhotoSession(sessionId);
      }

      // Hapus data sementara versi lama.
      try {
        sessionStorage.removeItem("tf-booth-session");
      } catch {
        // Abaikan jika sessionStorage
        // tidak tersedia.
      }

      // Pengunjung baru selalu melihat tutorial lagi.
      setSkipTutorial(false);

      // Kembali ke halaman utama.
      router.replace("/");
    } catch (err) {
      console.error("New session error:", err);

      setError("Sesi lama gagal dihapus. Coba sekali lagi.");

      setIsProcessing(false);
    }
  }

  return (
    <section className={styles.root} aria-labelledby="next-visitor-title">
      <p className="dtc-meta">Pengunjung berikutnya</p>
      <h2 id="next-visitor-title" className={styles.title}>
        Next, please.
      </h2>
      <p className={styles.text}>
        Pastikan pengunjung tadi sudah scan QR dan fotonya kebuka di HP-nya.
      </p>

      {!qrReady && (
        <p className={styles.warning}>
          Bikin QR dulu biar pengunjung bisa menyimpan fotonya.
        </p>
      )}

      {!showConfirm ? (
        <button
          type="button"
          className="dtc-btn dtc-btn--block"
          onClick={() => setShowConfirm(true)}
        >
          <span>Mulai sesi baru</span>
          <span className="dtc-btn__arrow">
            <i className="dtc-arrow" aria-hidden="true" />
          </span>
        </button>
      ) : (
        <div className={styles.confirm}>
          <h3 className={styles.confirmTitle}>Mulai sesi baru?</h3>
          <p className={styles.text}>
            Foto sesi ini akan dihapus dari browser. Tenang, foto yang sudah
            jadi QR tetap bisa dibuka sampai masa aktifnya habis.
          </p>
          <div className={styles.actions}>
            <button
              type="button"
              className="dtc-btn"
              onClick={() => setShowConfirm(false)}
              disabled={isProcessing}
            >
              <span>Batal</span>
            </button>
            <button
              type="button"
              className="dtc-btn dtc-btn--primary"
              onClick={handleNewSession}
              disabled={isProcessing}
            >
              <span>{isProcessing ? "Memulai…" : "Ya, mulai baru"}</span>
            </button>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
    </section>
  );
}
