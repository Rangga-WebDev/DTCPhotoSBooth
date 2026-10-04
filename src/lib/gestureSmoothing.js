/** @format */

import { GESTURES } from "../data/gestures";

const VALID = new Set(GESTURES.map((gesture) => gesture.id));

// Kehadiran gestur dihitung dari jendela waktu, bukan satu frame, supaya kedip deteksi tidak mereset hold.
export function createGestureSmoother({
  windowMs = 450,
  presence = 0.5,
  minFrames = 3,
} = {}) {
  let frames = [];

  return {
    push(hands, now) {
      const best = hands
        .filter((hand) => VALID.has(hand.id))
        .sort((a, b) => b.confidence - a.confidence)[0];

      frames.push({
        now,
        id: best?.id ?? null,
        label: best?.label ?? "",
        confidence: best?.confidence ?? 0,
      });
      frames = frames.filter((frame) => now - frame.now <= windowMs);

      const hits = frames.filter((frame) => frame.id);
      const ratio = frames.length ? hits.length / frames.length : 0;
      const present = frames.length >= minFrames && ratio >= presence;

      // Label = gestur yang paling sering muncul di jendela.
      const tally = new Map();
      hits.forEach((frame) => {
        const entry = tally.get(frame.id) ?? { ...frame, count: 0, sum: 0 };
        entry.count += 1;
        entry.sum += frame.confidence;
        tally.set(frame.id, entry);
      });
      const top = [...tally.values()].sort((a, b) => b.count - a.count)[0];

      return {
        present,
        ratio,
        id: present ? top.id : null,
        label: present ? top.label : "",
        confidence: present ? top.sum / top.count : 0,
      };
    },

    reset() {
      frames = [];
    },
  };
}
