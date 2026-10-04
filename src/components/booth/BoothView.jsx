/** @format */

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { pad2 } from "../../data/formats";
import useAutoCapture, { CAPTURE_STATE } from "../../hooks/useAutoCapture";
import useGestureStream from "../../hooks/useGestureStream";
import {
  isBoothAudioReady,
  playCameraShutter,
  playCompletionSound,
  playCountdownBeep,
  subscribeBoothAudio,
  unlockBoothAudio,
} from "../../lib/boothAudio";
import { getGestureRuntime } from "../../lib/gestureRecognizer";
import { savePhotoSession } from "../../lib/photoStorage";
import { completeSession, useSessionNumber } from "../../lib/sessionCounter";
import DtcHeader from "../brand/DtcHeader";
import CameraPreview from "../camera/CameraPreview";
import HandGlyph from "../gestures/HandGlyph";
import BoothHealthCheck from "../kiosk/BoothHealthCheck";
import HandOverlay from "./HandOverlay";
import StatusRail from "./StatusRail";
import styles from "./booth.module.css";

const LEGACY_SESSION_KEY = "tf-booth-session";
const { IDLE, FOUND, HOLD, LOCKED, COUNTDOWN, CAPTURE, COOLDOWN, COMPLETE } =
  CAPTURE_STATE;
const ARMED = new Set([FOUND, HOLD, LOCKED, COUNTDOWN, CAPTURE]);
const RAIL_STEP = {
  [IDLE]: 0,
  [FOUND]: 1,
  [HOLD]: 1,
  [LOCKED]: 2,
  [COUNTDOWN]: 3,
};

function useAudioReady() {
  return useSyncExternalStore(
    subscribeBoothAudio,
    isBoothAudioReady,
    () => false,
  );
}

function describe({ camera, model, state, countdown, pose }) {
  if (camera.status === "error") {
    return { title: "Kamera bermasalah.", text: camera.error };
  }
  if (camera.status !== "ready") {
    return {
      title: "Menyalakan kamera…",
      text: "Kalau browser minta izin kamera, pilih Izinkan.",
    };
  }
  if (model.status === "error") {
    return { title: "AI gagal jalan.", text: model.error };
  }
  if (model.status !== "ready") {
    return {
      title: "AI lagi disiapkan…",
      text: "Model pembaca gestur sedang dimuat, tunggu sebentar.",
    };
  }
  if (state === COMPLETE) {
    return {
      title: "Sesi selesai.",
      text: "Lanjut pilih desain photocard, lalu ambil fotonya lewat QR.",
    };
  }
  if (state === CAPTURE) {
    return { title: "Cekrek!", text: "Fotonya lagi disimpan." };
  }
  if (state === COUNTDOWN) {
    return {
      title: `Foto dalam ${countdown}…`,
      text: "Tahan posenya, lihat ke kamera sampai layar berkedip.",
    };
  }
  if (state === LOCKED) {
    return {
      title: "Terkunci. Siap!",
      text: "Hitungan mundur mulai sebentar lagi.",
    };
  }
  if (state === COOLDOWN) {
    return {
      title: "Turunkan tangan dulu.",
      text: "Foto berikutnya mulai setelah hand sign turun.",
    };
  }
  if (state === FOUND || state === HOLD) {
    return {
      title: "Tahan posenya!",
      text: "Sedikit lagi, tangan tetap kelihatan di kamera.",
    };
  }
  return {
    title: "Tunjukkan hand sign.",
    text: `Saran pose: ${pose?.label}. Gestur lain juga dihitung.`,
  };
}

export default function BoothView({ photoCount, themeId }) {
  const router = useRouter();
  const session = useSessionNumber();
  const audioReady = useAudioReady();

  const cameraRef = useRef(null);
  const overlayRef = useRef(null);
  const lastBeepRef = useRef(null);
  const flashTimeoutRef = useRef(null);
  const savingRef = useRef(false);

  const [camera, setCamera] = useState({
    status: "loading",
    error: "",
    video: null,
  });
  const [live, setLive] = useState({ gesture: null, roi: null, stats: null });
  const [flash, setFlash] = useState(false);
  const [finalPhotos, setFinalPhotos] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [audioError, setAudioError] = useState("");

  const sessionComplete = finalPhotos.length > 0;

  function triggerFlash() {
    if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);

    setFlash(true);
    flashTimeoutRef.current = setTimeout(() => {
      setFlash(false);
      flashTimeoutRef.current = null;
    }, 180);
  }

  async function handleEnableAudio() {
    try {
      setAudioError("");
      const ready = await unlockBoothAudio();
      if (!ready) throw new Error("Suara belum bisa dinyalakan.");
      playCameraShutter();
    } catch (error) {
      console.error("Audio error:", error);
      setAudioError(error.message || "Suara gagal dinyalakan.");
    }
  }

  function capturePhotoFromCamera() {
    const image = cameraRef.current?.capture();
    if (!image) return null;

    triggerFlash();
    playCameraShutter();
    return image;
  }

  const autoCapture = useAutoCapture({
    photoCount,
    onCapture: capturePhotoFromCamera,
    onComplete: (photos) => {
      setFinalPhotos(photos);
      playCompletionSound();
    },
  });

  const {
    state,
    countdown,
    progress,
    currentIndex,
    total,
    capturedPhotos,
    currentPose,
  } = autoCapture;

  const model = useGestureStream(camera.video, (result) => {
    const locked = [LOCKED, COUNTDOWN, CAPTURE].includes(autoCapture.state);
    overlayRef.current?.draw(result.landmarks, {
      active: ARMED.has(autoCapture.state),
      progress: locked ? 100 : autoCapture.progress,
      roi: result.roi,
    });
    setLive({
      gesture: result.gesture.present ? result.gesture : null,
      roi: result.roi,
      stats: result.stats,
    });

    if (!sessionComplete) autoCapture.processGesture(result);
  });

  useEffect(() => {
    if (!audioReady || state !== COUNTDOWN) {
      lastBeepRef.current = null;
      return;
    }

    if (countdown >= 1 && countdown <= 3 && lastBeepRef.current !== countdown) {
      lastBeepRef.current = countdown;
      playCountdownBeep(countdown);
    }
  }, [audioReady, state, countdown]);

  useEffect(
    () => () => {
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    },
    [],
  );

  function handleResetSession() {
    if (isSaving) return;

    setFinalPhotos([]);
    setLive({ gesture: null, roi: null, stats: null });
    setFlash(false);
    setSaveError("");
    lastBeepRef.current = null;

    if (flashTimeoutRef.current) {
      clearTimeout(flashTimeoutRef.current);
      flashTimeoutRef.current = null;
    }

    try {
      sessionStorage.removeItem(LEGACY_SESSION_KEY);
    } catch {
      // sessionStorage tidak wajib.
    }

    overlayRef.current?.draw([]);
    autoCapture.reset();
  }

  async function handleContinueToEditor() {
    if (
      !sessionComplete ||
      finalPhotos.length !== photoCount ||
      savingRef.current
    ) {
      return;
    }

    savingRef.current = true;
    setIsSaving(true);
    setSaveError("");

    try {
      const sessionId = await savePhotoSession({
        photos: finalPhotos,
        photoCount,
        themeId,
        sessionNumber: Number(session) || undefined,
      });

      completeSession();
      router.push(`/frame?session=${encodeURIComponent(sessionId)}`);
    } catch (error) {
      console.error("Save photo session error:", error);
      setSaveError(
        error.message ||
          "Fotonya gagal disimpan. Jangan tutup halaman ini, coba sekali lagi.",
      );
      savingRef.current = false;
      setIsSaving(false);
    }
  }

  const tracking = camera.status === "ready" && model.status === "ready";
  const message = describe({
    camera,
    model,
    state,
    countdown,
    pose: currentPose,
  });
  const railActive = tracking ? (RAIL_STEP[state] ?? -1) : -1;
  const railDone = [CAPTURE, COOLDOWN, COMPLETE].includes(state);
  const locked = [LOCKED, COUNTDOWN, CAPTURE].includes(state);
  const runtime = getGestureRuntime();
  const { gesture, roi, stats } = live;
  const zoomed = tracking && roi && roi.mode !== "wide";
  const ai =
    model.status === "ready"
      ? { state: "live", label: "Active" }
      : model.status === "error"
        ? { state: "error", label: "Offline" }
        : {
            state: undefined,
            label: camera.status === "ready" ? "Loading" : "Standby",
          };
  const video = camera.video;
  const resolution = video
    ? `${video.videoWidth} × ${video.videoHeight}`
    : "— × —";
  const shot = Math.min(currentIndex + 1, total);

  return (
    <main className={`dtc-page dtc-surface-ink ${styles.page}`}>
      <div className="dtc-shutter dtc-shutter--open" aria-hidden="true" />

      <DtcHeader
        logoPlate
        meta={
          <>
            <span>DTC Booth</span>
            <span>Live camera</span>
            <span>Session {session}</span>
          </>
        }
      >
        <span className="dtc-status" data-state={ai.state}>
          <i className="dtc-node" />
          <span className={styles.aiText}>AI hand tracking · </span>
          {ai.label}
        </span>
        <Link href="/" className={styles.exit}>
          Keluar
        </Link>
      </DtcHeader>

      <h1 className="dtc-visually-hidden">
        Live camera DTCBooth, foto {shot} dari {total}
      </h1>

      <section className={styles.viewer} aria-label="Kamera booth">
        <div className={styles.stage} data-locked={locked || undefined}>
          <CameraPreview
            ref={cameraRef}
            className={styles.video}
            onReady={(element) =>
              setCamera({ status: "ready", error: "", video: element })
            }
            onError={(error) =>
              setCamera({ status: "error", error, video: null })
            }
          />
          <HandOverlay ref={overlayRef} video={video} />
          <i className={`dtc-corners ${styles.brackets}`} aria-hidden="true" />

          <div className={styles.hudTop} aria-hidden="true">
            <span
              className="dtc-status"
              data-state={camera.status === "ready" ? "live" : undefined}
            >
              <i className="dtc-node" />
              {camera.status === "ready" ? "Live" : "Standby"}
            </span>
            <span>{resolution}</span>
            {tracking && stats && <span>AI {stats.fps} fps</span>}
            <span>
              Foto {pad2(shot)} / {pad2(total)}
            </span>
          </div>

          <div className={styles.hudBottom} aria-hidden="true">
            <span>Detected</span>
            <strong>{gesture ? gesture.label : "—"}</strong>
            {gesture && <span>{Math.round(gesture.confidence * 100)}%</span>}
            {zoomed && (
              <span className={styles.hudMode}>
                {roi.mode === "follow" ? "Distant hand mode" : "Scanning"} ·{" "}
                {roi.zoom}×
              </span>
            )}
          </div>

          {state === COUNTDOWN && countdown !== null && (
            <div className={styles.countdown} aria-hidden="true">
              <span>Foto dalam</span>
              <strong key={countdown}>{countdown}</strong>
            </div>
          )}

          {flash && <div className={styles.flash} aria-hidden="true" />}

          {camera.status !== "ready" && (
            <div className={styles.cameraState} aria-hidden="true">
              <span className="dtc-meta">
                Cam / {camera.status === "error" ? "Error" : "Connecting"}
              </span>
              <strong>
                {camera.status === "error" ? "No signal" : "Standby"}
              </strong>
            </div>
          )}

          {sessionComplete && (
            <div className={styles.complete}>
              <p className="dtc-meta">
                Session {session} / {pad2(total)} foto
              </p>
              <h2 className={styles.completeTitle}>
                <span>Session</span>
                <span className="dtc-accent">complete.</span>
              </h2>
              <p className={styles.completeText}>
                Semua foto sudah masuk. Berikutnya pilih desain photocard, lalu
                ambil fotonya lewat QR.
              </p>
              <div className={styles.completeActions}>
                <button
                  type="button"
                  className="dtc-btn dtc-btn--primary dtc-btn--lg"
                  onClick={handleContinueToEditor}
                  disabled={isSaving}
                >
                  <span className="dtc-btn__index">04</span>
                  <span>{isSaving ? "Menyimpan…" : "Pilih desain"}</span>
                  <span className="dtc-btn__arrow">
                    <i className="dtc-arrow" aria-hidden="true" />
                  </span>
                </button>
                <button
                  type="button"
                  className="dtc-btn dtc-btn--lg"
                  onClick={handleResetSession}
                  disabled={isSaving}
                >
                  <span>Ulang dari awal</span>
                </button>
              </div>
              {saveError && (
                <p className={styles.error} role="alert">
                  {saveError}
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      <aside className={styles.inspector} aria-label="Panel sesi">
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <span>
              Pose {pad2(shot)} / {pad2(total)}
            </span>
            <span className="dtc-tag dtc-tag--accent">Saran</span>
          </div>
          <HandGlyph pose={currentPose?.id} className={styles.poseGlyph} />
          <strong className={styles.poseName}>{currentPose?.label}</strong>
          <p className={styles.poseHint}>
            Gestur lain dari tutorial juga dihitung.
          </p>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <span>Roll</span>
            <span>
              {pad2(capturedPhotos.length)} / {pad2(total)}
            </span>
          </div>
          <ol className={styles.roll}>
            {Array.from({ length: total }, (_, index) => {
              const photo = capturedPhotos[index];
              const state = photo
                ? "filled"
                : index === capturedPhotos.length
                  ? "next"
                  : "empty";

              return (
                <li key={index} className={styles.slot} data-state={state}>
                  {photo && (
                    // eslint-disable-next-line @next/next/no-img-element -- data URL dari kamera
                    <img src={photo} alt={`Foto ke-${index + 1}`} />
                  )}
                  <span>{pad2(index + 1)}</span>
                </li>
              );
            })}
          </ol>
        </section>

        <section className={`${styles.panel} ${styles.controls}`}>
          <div className={styles.audio}>
            <span className="dtc-meta">Suara</span>
            <strong>{audioReady ? "Nyala" : "Mati"}</strong>
            <button
              type="button"
              className="dtc-btn dtc-btn--sm"
              onClick={handleEnableAudio}
            >
              <span>{audioReady ? "Tes" : "Nyalakan"}</span>
            </button>
          </div>
          {audioError && (
            <p className={styles.error} role="alert">
              {audioError}
            </p>
          )}
          <dl className={styles.engine}>
            <div>
              <dt>AI</dt>
              <dd>
                {runtime.wasm === "local"
                  ? "Offline-ready"
                  : runtime.wasm === "cdn"
                    ? "CDN"
                    : "—"}
              </dd>
            </div>
            <div>
              <dt>Tangan</dt>
              <dd>Maks. {runtime.maxHands}</dd>
            </div>
            <div>
              <dt>Analisis</dt>
              <dd>{stats ? `${stats.width} px · ${stats.ms} ms` : "—"}</dd>
            </div>
          </dl>
          <BoothHealthCheck cameraRef={cameraRef} audioReady={audioReady} />
          <button
            type="button"
            className="dtc-btn dtc-btn--sm dtc-btn--block"
            onClick={handleResetSession}
            disabled={isSaving}
          >
            <span>Ulang dari awal</span>
            <span className="dtc-btn__arrow">
              <i className="dtc-arrow dtc-arrow--back" aria-hidden="true" />
            </span>
          </button>
        </section>
      </aside>

      <section className={styles.rail} aria-label="Status foto">
        <StatusRail
          active={railActive}
          complete={railDone}
          progress={progress}
          countdown={countdown}
        />
        <div className={styles.message} aria-live="polite">
          <strong>{message.title}</strong>
          <p>{message.text}</p>
        </div>
      </section>
    </main>
  );
}
