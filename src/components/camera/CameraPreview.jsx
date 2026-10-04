/** @format */

"use client";

import { useEffect, useImperativeHandle, useRef } from "react";

// Hanya elemen video (tampilan cermin); status & HUD digambar oleh halaman booth.
export default function CameraPreview({ ref, onReady, onError, className }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const callbacksRef = useRef({ onReady, onError });

  useEffect(() => {
    callbacksRef.current = { onReady, onError };
  }, [onReady, onError]);

  // Mulai kamera ketika komponen ditampilkan
  useEffect(() => {
    let cancelled = false;
    let activeStream = null;
    const video = videoRef.current;

    async function startCamera() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error(
            "Browser ini nggak bisa akses kamera. Pakai Chrome atau Edge.",
          );
        }

        // 1080p untuk foto & detail tangan jauh; AI tetap menganalisis di canvas kecil (useGestureStream).
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: "user",
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            frameRate: { ideal: 30 },
          },
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        activeStream = stream;
        streamRef.current = stream;

        if (video) {
          video.srcObject = stream;

          await video.play();

          if (!cancelled) {
            callbacksRef.current.onReady?.(video);
          }
        }
      } catch (error) {
        if (cancelled) return;

        let message = "Kamera nggak bisa dinyalakan.";

        if (error.name === "NotAllowedError") {
          message =
            "Izin kamera ditolak. Buka pengaturan browser, lalu izinkan kamera.";
        } else if (error.name === "NotFoundError") {
          message = "Webcam nggak ketemu. Cek kabel atau colokannya.";
        } else if (error.name === "NotReadableError") {
          message =
            "Kamera lagi dipakai aplikasi lain. Tutup dulu aplikasinya.";
        } else {
          message = error.message || message;
        }

        callbacksRef.current.onError?.(message);
      }
    }

    startCamera();

    // Matikan kamera ketika meninggalkan halaman
    return () => {
      cancelled = true;

      if (activeStream) {
        activeStream.getTracks().forEach((track) => {
          track.stop();
        });
      }

      streamRef.current = null;

      if (video) video.srcObject = null;
    };
  }, []);

  // Fungsi yang bisa dipanggil dari komponen induk
  useImperativeHandle(ref, () => ({
    getVideo() {
      return videoRef.current;
    },

    capture() {
      const video = videoRef.current;

      if (!video || video.readyState < 2) {
        return null;
      }

      const canvas = document.createElement("canvas");

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");

      if (!ctx) return null;

      // Hasil foto mengikuti tampilan cermin selfie
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      return canvas.toDataURL("image/jpeg", 0.92);
    },

    stop() {
      streamRef.current?.getTracks().forEach((track) => {
        track.stop();
      });

      streamRef.current = null;
    },
  }));

  return (
    <video
      ref={videoRef}
      className={className}
      autoPlay
      playsInline
      muted
      style={{ transform: "scaleX(-1)" }}
    />
  );
}
