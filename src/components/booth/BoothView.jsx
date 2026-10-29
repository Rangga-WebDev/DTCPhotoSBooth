/** @format */

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

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
import { getGestureRuntime } from "../../lib/gestureEngine";
import { savePhotoSession } from "../../lib/photoStorage";
import { completeSession, useSessionNumber } from "../../lib/sessionCounter";
import Icon from "../brand/Icon";
import SiteHeader from "../brand/SiteHeader";
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
const LOCKED_STATES = new Set([LOCKED, COUNTDOWN, CAPTURE]);
const RAIL_STEP = { [IDLE]: 0, [FOUND]: 1, [HOLD]: 1, [LOCKED]: 2, [COUNTDOWN]: 3 };
// HUD diperbarui paling sering 5× per detik; overlay tangan tetap digambar tiap frame AI.
const HUD_MS = 200;
const DARK = 0.18;
const FAR = 0.055;
const UNREAD_MS = 1600;
const EMPTY_LIVE = {
  gesture: "",
  confidence: 0,
  hands: 0,
  hint: null,
  fps: 0,
  ms: 0,
  width: 0,
  zoom: null,
};

function useAudioReady() {
  return useSyncExternalStore(subscribeBoothAudio, isBoothAudioReady, () => false);
}

// Satu petunjuk paling penting dari AI, hanya saat gestur belum terbaca
// (kalau AI sudah membaca gestur, petunjuk tidak perlu mengganggu).
function qualityHint(result, unreadSince) {
  const { light, hands, gesture, active, timestamp } = result;
  if (gesture.present) return null;
  if (light !== null && light < DARK) {
    return "Cahaya kurang. Tambah lampu dari depan, jangan membelakangi jendela.";
  }
  const focus = active ?? hands[0];
  if (focus?.edge) return "Tangan terpotong di tepi layar. Geser sedikit ke tengah.";
  if (hands.length && unreadSince && timestamp - unreadSince > UNREAD_MS) {
    return "Tangan terlihat, tapi gesturnya belum terbaca. Tegakkan jari dan hadapkan telapak ke kamera.";
  }
  if (focus && focus.size < FAR) {
    return "Agak jauh dari kamera. Maju sedikit atau angkat tangan lebih tinggi.";
  }
  return null;
}

function sameLive(a, b) {
  return Object.keys(EMPTY_LIVE).every((key) => a[key] === b[key]);
}

function describe({ camera, model, state, countdown, pose, steady }) {
  if (camera.status === "error") return { title: "Kamera bermasalah.", text: camera.error };
  if (camera.status !== "ready") {
    return {
      title: "Menyalakan kamera…",
      text: "Kalau browser minta izin kamera, pilih Izinkan.",
    };
  }
  // AI dijeda saat sesi selesai, jadi status ini dicek sebelum status model.
  if (state === COMPLETE) {
    return {
      title: "Sesi selesai!",
      text: "Lanjut pilih desain photocard, lalu ambil fotonya lewat QR.",
    };
  }
  if (model.status === "error") return { title: "AI gagal jalan.", text: model.error };
  if (model.status !== "ready") {
    return {
      title: "AI sedang disiapkan…",
      text: "Model pembaca gestur sedang dimuat, tunggu sebentar.",
    };
  }
  if (state === CAPTURE) return { title: "Cekrek!", text: "Fotonya sedang disimpan." };
  if (state === COUNTDOWN) {
    return {
      title: `Foto dalam ${countdown}…`,
      text: "Tahan pose, lihat ke kamera sampai layar berkedip.",
    };
  }
  if (state === LOCKED) {
    return { title: "Terkunci. Siap!", text: "Hitungan mundur mulai sebentar lagi." };
  }
  if (state === COOLDOWN) {
    return {
      title: "Turunkan tangan dulu.",
      text: "Foto berikutnya mulai setelah hand sign turun.",
    };
  }
  if (state === FOUND || state === HOLD) {
    return steady
      ? { title: "Tahan posenya!", text: "Sedikit lagi, tangan tetap terlihat di kamera." }
      : { title: "Tahan tangan tetap diam.", text: "Gesturnya terbaca, tapi tangan masih bergerak." };
  }
  return {
    title: "Tunjukkan hand sign.",
    text: `Saran pose: ${pose?.label}. Gestur lain dari tutorial juga dihitung.`,
  };
}

const PoseCard = memo(function PoseCard({ pose, shot, total }) {
  return (
    <section className={styles.panel}>
      <div className={styles.panelHead}>
        <span className="cia-label">Saran pose</span>
        <span className="cia-label cia-tnum">
          Foto {pad2(shot)} / {pad2(total)}
        </span>
      </div>
      <div className={styles.pose}>
        <HandGlyph pose={pose?.id} className={styles.poseGlyph} />
        <div>
          <strong className={styles.poseName}>{pose?.label}</strong>
          <p className={styles.poseHint}>{pose?.note}. Gestur lain juga dihitung.</p>
        </div>
      </div>
    </section>
  );
});

const Roll = memo(function Roll({ shots, total }) {
  return (
    <section className={styles.panel}>
      <div className={styles.panelHead}>
        <span className="cia-label">Hasil foto</span>
        <span className="cia-label cia-tnum">
          {pad2(shots.length)} / {pad2(total)}
        </span>
      </div>
      <ol className={styles.roll}>
        {Array.from({ length: total }, (_, index) => {
          const shot = shots[index];
          const state = shot ? "filled" : index === shots.length ? "next" : "empty";
          return (
            <li key={index} className={styles.slot} data-state={state}>
              {shot && (
                // eslint-disable-next-line @next/next/no-img-element -- thumbnail data URL dari kamera
                <img src={shot.thumb} alt={`Foto ke-${index + 1}`} />
              )}
              <span>{pad2(index + 1)}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
});

const Controls = memo(function Controls({
  audioReady,
  audioError,
  onAudio,
  onReset,
  busy,
  cameraRef,
}) {
  return (
    <section className={styles.panel}>
      <div className={styles.panelHead}>
        <span className="cia-label">Operator</span>
      </div>
      <div className={styles.controlRow}>
        <span className="cia-status" data-state={audioReady ? "ok" : "warn"}>
          Suara {audioReady ? "nyala" : "mati"}
        </span>
        <button type="button" className="cia-btn cia-btn--sm" onClick={onAudio}>
          <Icon name="sound" />
          {audioReady ? "Tes" : "Nyalakan"}
        </button>
      </div>
      {audioError && (
        <p className="cia-error" role="alert">
          {audioError}
        </p>
      )}
      <BoothHealthCheck cameraRef={cameraRef} audioReady={audioReady} />
      <button
        type="button"
        className="cia-btn cia-btn--sm cia-btn--block"
        onClick={onReset}
        disabled={busy}
      >
        <Icon name="refresh" />
        Ulang dari awal
      </button>
    </section>
  );
});

export default function BoothView({ photoCount }) {
  const router = useRouter();
  const session = useSessionNumber();
  const audioReady = useAudioReady();

  const cameraRef = useRef(null);
  const overlayRef = useRef(null);
  const lastBeepRef = useRef(null);
  const flashTimeoutRef = useRef(null);
  const savingRef = useRef(false);
  const hudAtRef = useRef(0);
  const unreadSinceRef = useRef(0);

  const [camera, setCamera] = useState({ status: "loading", error: "", video: null });
  const [live, setLive] = useState(EMPTY_LIVE);
  const [flash, setFlash] = useState(false);
  const [finalShots, setFinalShots] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [audioError, setAudioError] = useState("");

  const sessionComplete = finalShots.length > 0;

  function triggerFlash() {
    if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    setFlash(true);
    flashTimeoutRef.current = setTimeout(() => {
      setFlash(false);
      flashTimeoutRef.current = null;
    }, 160);
  }

  const autoCapture = useAutoCapture({
    photoCount,
    onCapture: () => {
      const shot = cameraRef.current?.capture();
      if (!shot) return null;
      triggerFlash();
      playCameraShutter();
      return shot;
    },
    onComplete: (shots) => {
      setFinalShots(shots);
      overlayRef.current?.draw([]);
      playCompletionSound();
    },
  });

  const { state, countdown, progress, steady, currentIndex, total, captured, currentPose } =
    autoCapture;

  const model = useGestureStream(sessionComplete ? null : camera.video, (result) => {
    overlayRef.current?.draw(result.hands, {
      activeId: result.gesture.trackId,
      armed: ARMED.has(state),
      progress: LOCKED_STATES.has(state) ? 100 : progress,
      roi: result.roi,
    });

    if (!sessionComplete) autoCapture.processGesture(result);

    if (result.hands.length && !result.gesture.present) {
      unreadSinceRef.current ||= result.timestamp;
    } else {
      unreadSinceRef.current = 0;
    }

    if (result.timestamp - hudAtRef.current < HUD_MS) return;
    hudAtRef.current = result.timestamp;
    const next = {
      gesture: result.gesture.present ? result.gesture.label : "",
      confidence: result.gesture.present ? Math.round(result.gesture.confidence * 100) : 0,
      hands: result.hands.length,
      hint: qualityHint(result, unreadSinceRef.current),
      fps: result.stats.fps,
      ms: result.stats.ms,
      width: result.stats.width,
      zoom: result.roi.mode === "follow" ? result.roi.zoom : null,
    };
    setLive((previous) => (sameLive(previous, next) ? previous : next));
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

  const handleEnableAudio = useCallback(async () => {
    try {
      setAudioError("");
      const ready = await unlockBoothAudio();
      if (!ready) throw new Error("Suara belum bisa dinyalakan.");
      playCameraShutter();
    } catch (error) {
      console.error("Audio error:", error);
      setAudioError(error.message || "Suara gagal dinyalakan.");
    }
  }, []);

  const { reset } = autoCapture;
  const handleResetSession = useCallback(() => {
    if (savingRef.current) return;

    setFinalShots([]);
    setLive(EMPTY_LIVE);
    setFlash(false);
    setSaveError("");
    lastBeepRef.current = null;
    unreadSinceRef.current = 0;

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
    reset();
  }, [reset]);

  async function handleContinue() {
    if (!sessionComplete || finalShots.length !== photoCount || savingRef.current) return;

    savingRef.current = true;
    setIsSaving(true);
    setSaveError("");

    try {
      const photos = await Promise.all(finalShots.map((shot) => shot.blob));
      const sessionId = await savePhotoSession({
        photos,
        photoCount,
        sessionNumber: Number(session) || undefined,
      });
      completeSession();
      router.push(`/frame?session=${encodeURIComponent(sessionId)}`);
    } catch (error) {
      console.error("Save photo session error:", error);
      setSaveError(
        error.message || "Fotonya gagal disimpan. Jangan tutup halaman ini, coba sekali lagi.",
      );
      savingRef.current = false;
      setIsSaving(false);
    }
  }

  const tracking = camera.status === "ready" && model.status === "ready";
  const message = describe({ camera, model, state, countdown, pose: currentPose, steady });
  const railActive = tracking ? (RAIL_STEP[state] ?? -1) : -1;
  const railDone = [CAPTURE, COOLDOWN, COMPLETE].includes(state);
  const locked = LOCKED_STATES.has(state);
  const runtime = getGestureRuntime();
  const ai = sessionComplete
    ? { state: "ok", label: "AI dijeda" }
    : model.status === "ready"
      ? { state: "ok", label: "AI aktif" }
      : model.status === "error"
        ? { state: "error", label: "AI offline" }
        : { state: "warn", label: "AI dimuat" };
  const shot = Math.min(currentIndex + 1, total);
  const hint = tracking && !sessionComplete && state !== COUNTDOWN ? live.hint : null;

  return (
    <main className={`cia-page ${styles.page}`}>
      <SiteHeader
        meta={
          <>
            <span className="cia-label cia-tnum">Sesi {session}</span>
            <span className="cia-label cia-tnum">
              Foto {pad2(shot)} / {pad2(total)}
            </span>
          </>
        }
      >
        <span className="cia-status" data-state={ai.state}>
          {ai.label}
        </span>
        <Link href="/" className="cia-btn cia-btn--sm cia-btn--ghost">
          Keluar
        </Link>
      </SiteHeader>

      <h1 className="cia-visually-hidden">
        Kamera CIA Photobooth, foto {shot} dari {total}
      </h1>

      <div className={styles.body}>
        <section className={styles.stage} data-locked={locked || undefined} aria-label="Kamera booth">
          <CameraPreview
            ref={cameraRef}
            className={styles.video}
            onReady={(element) => setCamera({ status: "ready", error: "", video: element })}
            onError={(error) => setCamera({ status: "error", error, video: null })}
          />
          <HandOverlay ref={overlayRef} video={camera.video} />

          <div className={styles.hudTop} aria-hidden="true">
            <span className="cia-status" data-state={camera.status === "ready" ? "live" : undefined}>
              {camera.status === "ready" ? "Live" : "Standby"}
            </span>
            <span className="cia-tnum">
              Foto {pad2(shot)} / {pad2(total)}
            </span>
            {live.zoom && <span className="cia-tnum">Zoom tangan jauh {live.zoom}×</span>}
            {tracking && !live.hands && !sessionComplete && <span>Mencari tangan…</span>}
          </div>

          <div className={styles.hudBottom} aria-hidden="true">
            <span className="cia-label">Gestur</span>
            <strong>{live.gesture || "—"}</strong>
            {live.gesture && <span className="cia-tnum">{live.confidence}%</span>}
          </div>

          {state === COUNTDOWN && countdown !== null && (
            <div className={styles.countdown} aria-hidden="true">
              <strong key={countdown}>{countdown}</strong>
            </div>
          )}

          {flash && <div className={styles.flash} aria-hidden="true" />}

          {camera.status !== "ready" && (
            <div className={styles.cameraState} aria-hidden="true">
              <span className="cia-label">
                {camera.status === "error" ? "Kamera error" : "Menghubungkan kamera"}
              </span>
              <strong>{camera.status === "error" ? "No signal" : "Standby"}</strong>
            </div>
          )}

          {sessionComplete && (
            <div className={styles.complete}>
              <p className="cia-label cia-kicker">
                Sesi {session} · {pad2(total)} foto
              </p>
              <h2 className={`cia-display ${styles.completeTitle}`}>
                Sesi <span className="cia-red">selesai.</span>
              </h2>
              <p className={styles.completeText}>
                Semua foto sudah masuk. Berikutnya pilih desain photocard, lalu ambil
                fotonya lewat QR.
              </p>
              <div className={styles.completeActions}>
                <button
                  type="button"
                  className="cia-btn cia-btn--primary cia-btn--lg"
                  onClick={handleContinue}
                  disabled={isSaving}
                >
                  {isSaving ? "Menyimpan…" : "Pilih desain"}
                  <Icon name="arrow" />
                </button>
                <button
                  type="button"
                  className="cia-btn cia-btn--lg"
                  onClick={handleResetSession}
                  disabled={isSaving}
                >
                  Ulang
                </button>
              </div>
              {saveError && (
                <p className="cia-error" role="alert">
                  {saveError}
                </p>
              )}
            </div>
          )}
        </section>

        <aside className={styles.side} aria-label="Panel sesi">
          <PoseCard pose={currentPose} shot={shot} total={total} />
          <Roll shots={captured} total={total} />
          <Controls
            audioReady={audioReady}
            audioError={audioError}
            onAudio={handleEnableAudio}
            onReset={handleResetSession}
            busy={isSaving}
            cameraRef={cameraRef}
          />
          <dl className={styles.engine}>
            <div>
              <dt>Mesin AI</dt>
              <dd>
                {runtime.backend === "worker"
                  ? "Worker"
                  : runtime.backend === "main"
                    ? "Main thread"
                    : "—"}
                {runtime.wasm === "cdn" ? " · CDN" : ""}
              </dd>
            </div>
            <div>
              <dt>Analisis</dt>
              <dd className="cia-tnum">{live.ms ? `${live.width} px · ${live.ms} ms` : "—"}</dd>
            </div>
            <div>
              <dt>Kecepatan</dt>
              <dd className="cia-tnum">{live.fps ? `${live.fps} fps` : "—"}</dd>
            </div>
          </dl>
        </aside>
      </div>

      <section className={styles.rail} aria-label="Status foto">
        <StatusRail active={railActive} complete={railDone} progress={progress} countdown={countdown} />
        <div className={styles.message} aria-live="polite">
          <strong>{message.title}</strong>
          <p>{hint ?? message.text}</p>
        </div>
      </section>
    </main>
  );
}
