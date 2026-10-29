/** @format */

"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import Icon from "../brand/Icon";
import styles from "./download.module.css";
import useNow from "./useNow";

const subscribeNever = () => () => {};
// Web Share hanya ada di HTTPS; di link Wi-Fi lokal (http) tombolnya disembunyikan.
const canShare = () => window.isSecureContext && typeof navigator.share === "function";

// Tombol simpan menempel di bawah layar HP selama photocard masih terlihat.
export default function DownloadActions({ imageUrl, downloadUrl, filename, expiresAt }) {
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
          ? { files: [file], title: "Photocard CIA Photobooth" }
          : { title: "Photocard CIA Photobooth", url: window.location.href },
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
            Masa aktif link ini baru saja habis, jadi photocard-nya sudah tidak bisa diunduh.
            Muat ulang halaman untuk melihat statusnya.
          </p>
        ) : (
          <>
            <a
              className="cia-btn cia-btn--primary cia-btn--lg cia-btn--block"
              href={downloadUrl}
              download={filename}
            >
              <Icon name="download" />
              Simpan photocard
            </a>
            {shareable && (
              <button type="button" className="cia-btn cia-btn--block" onClick={handleShare}>
                <Icon name="share" />
                Bagikan
              </button>
            )}
          </>
        )}
        {message && (
          <p className="cia-error" role="alert">
            {message}
          </p>
        )}
      </div>

      {!expired && (
        <div className={styles.more}>
          <a className="cia-link" href={imageUrl} target="_blank" rel="noopener noreferrer">
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
              Tombol Simpan menaruh file di folder Download. Bisa juga tekan lama fotonya, lalu
              Download gambar.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
