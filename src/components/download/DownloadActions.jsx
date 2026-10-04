/** @format */

"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import styles from "./download.module.css";
import useNow from "./useNow";

const subscribeNever = () => () => {};
// Web Share hanya ada di HTTPS; di link Wi-Fi lokal (http) tombolnya disembunyikan.
const canShare = () =>
  window.isSecureContext && typeof navigator.share === "function";

// Dirender langsung di grid layout: bar simpan menempel di bawah layar HP
// selama photocard di atasnya masih terlihat.
export default function DownloadActions({
  imageUrl,
  downloadUrl,
  filename,
  expiresAt,
}) {
  const shareable = useSyncExternalStore(subscribeNever, canShare, () => false);
  const now = useNow();
  const expired = now !== null && now >= expiresAt;
  const fileRef = useRef(null);
  const [message, setMessage] = useState("");

  // File disiapkan lebih dulu: Safari menolak share() setelah await jaringan.
  useEffect(() => {
    if (!shareable) return undefined;
    const controller = new AbortController();
    fetch(imageUrl, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.blob();
      })
      .then((blob) => {
        const file = new File([blob], filename, { type: "image/jpeg" });
        if (navigator.canShare?.({ files: [file] })) fileRef.current = file;
      })
      .catch(() => {});
    return () => controller.abort();
  }, [shareable, imageUrl, filename]);

  async function handleShare() {
    setMessage("");
    const file = fileRef.current;
    try {
      await navigator.share(
        file
          ? { files: [file], title: "Photocard DTCBooth" }
          : { title: "Photocard DTCBooth", url: window.location.href },
      );
    } catch (error) {
      if (error.name === "AbortError") return;
      setMessage("Menu bagikan gagal dibuka. Pakai tombol Simpan, ya.");
    }
  }

  return (
    <>
      <div className={styles.saveBar}>
        {expired ? (
          <p className={styles.expiredNote} role="status">
            Masa aktif link ini baru saja habis, jadi photocard-nya sudah tidak
            bisa diunduh. Muat ulang halaman untuk melihat statusnya.
          </p>
        ) : (
          <>
            <a
              className="dtc-btn dtc-btn--primary dtc-btn--lg dtc-btn--block"
              href={downloadUrl}
              download={filename}
            >
              <span>Simpan photocard</span>
              <span className="dtc-btn__arrow">
                <i className="dtc-arrow dtc-arrow--down" aria-hidden="true" />
              </span>
            </a>
            {shareable && (
              <button
                type="button"
                className="dtc-btn dtc-btn--block"
                onClick={handleShare}
              >
                <span>Bagikan</span>
                <span className="dtc-btn__arrow">
                  <i className="dtc-arrow dtc-arrow--ne" aria-hidden="true" />
                </span>
              </button>
            )}
          </>
        )}
        {message && (
          <p className={styles.error} role="alert">
            {message}
          </p>
        )}
      </div>

      {!expired && (
        <div className={styles.more}>
          <a
            className={styles.textLink}
            href={imageUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Buka ukuran penuh
          </a>
          <div className={styles.tips}>
            <p>
              <strong>iPhone</strong>
              {shareable
                ? "Tekan Bagikan lalu Simpan Gambar, atau tekan lama fotonya lalu Simpan ke Foto."
                : "Tekan lama fotonya, lalu pilih Simpan ke Foto."}
            </p>
            <p>
              <strong>Android</strong>
              Tombol Simpan menaruh file di folder Download. Bisa juga tekan
              lama fotonya, lalu Download gambar.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
