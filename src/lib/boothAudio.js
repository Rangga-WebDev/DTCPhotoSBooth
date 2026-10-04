/**
 * DTCBOOTH — AUDIO SYSTEM
 *   File: src/lib/boothAudio.js
 *
 * @format
 */

let audioContext = null;
let audioEnabled = false;
const listeners = new Set();

export function subscribeBoothAudio(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Mengaktifkan audio melalui klik (tombol operator atau CTA sebelum booth).
export async function unlockBoothAudio() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;

  if (!AudioContextClass) {
    throw new Error("Browser ini nggak bisa memutar suara.");
  }

  if (!audioContext || audioContext.state === "closed") {
    audioContext = new AudioContextClass();
  }

  if (audioContext.state === "suspended") {
    await audioContext.resume();
  }

  audioEnabled = audioContext.state === "running";
  listeners.forEach((listener) => listener());

  return audioEnabled;
}

export function isBoothAudioReady() {
  return audioEnabled && audioContext?.state === "running";
}

// Suara countdown angka 3, 2, dan 1.
export function playCountdownBeep(number) {
  if (!isBoothAudioReady()) return;

  const now = audioContext.currentTime;

  const oscillator = audioContext.createOscillator();

  const gain = audioContext.createGain();

  oscillator.type = "sine";

  oscillator.frequency.setValueAtTime(number === 1 ? 1046 : 784, now);

  gain.gain.setValueAtTime(0.0001, now);

  gain.gain.exponentialRampToValueAtTime(0.15, now + 0.015);

  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

  oscillator.connect(gain);
  gain.connect(audioContext.destination);

  oscillator.start(now);
  oscillator.stop(now + 0.17);
}

// Suara shutter kamera.
export function playCameraShutter() {
  if (!isBoothAudioReady()) return;

  const now = audioContext.currentTime;

  function playClick(start, frequency) {
    const oscillator = audioContext.createOscillator();

    const gain = audioContext.createGain();

    oscillator.type = "square";

    oscillator.frequency.setValueAtTime(frequency, start);

    oscillator.frequency.exponentialRampToValueAtTime(130, start + 0.055);

    gain.gain.setValueAtTime(0.0001, start);

    gain.gain.exponentialRampToValueAtTime(0.12, start + 0.005);

    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.07);

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start(start);
    oscillator.stop(start + 0.075);
  }

  playClick(now, 1100);
  playClick(now + 0.085, 650);
}

// Suara ketika sesi foto selesai.
export function playCompletionSound() {
  if (!isBoothAudioReady()) return;

  const notes = [523, 659, 784];

  notes.forEach((frequency, index) => {
    const start = audioContext.currentTime + index * 0.13;

    const oscillator = audioContext.createOscillator();

    const gain = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = frequency;

    gain.gain.setValueAtTime(0.0001, start);

    gain.gain.exponentialRampToValueAtTime(0.12, start + 0.02);

    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start(start);
    oscillator.stop(start + 0.23);
  });
}
