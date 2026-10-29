/**
 * PENGHALUSAN GESTUR
 *   Kehadiran gestur = "bukti" yang naik saat gestur terlihat dan turun saat hilang,
 *   dengan histeresis (naik di 0,6 / turun di 0,3). Kedip deteksi satu-dua frame
 *   tidak mereset hold, tapi tangan yang benar-benar turun cepat dianggap hilang.
 *   Label = suara terbanyak (meluruh) dari frame terakhir.
 *
 * @format
 */

const RISE_MS = 260;
const FALL_MS = 320;
const ON = 0.6;
const OFF = 0.3;
const VOTE_DECAY_MS = 450;

export function createGestureSmoother() {
  let level = 0;
  let present = false;
  let last = null;
  let confidence = 0;
  let activeHand = null;
  const votes = new Map();

  return {
    // candidates: [{ id, label, confidence, trackId }] dari recognizeHands().
    push(candidates, now) {
      const dt = last === null ? 0 : Math.min(250, now - last);
      last = now;

      // Tangan yang sedang dipakai diutamakan supaya label tidak lompat-lompat.
      const best =
        candidates.find((item) => item.trackId === activeHand && item.confidence >= 0.5) ??
        candidates.reduce((top, item) => (!top || item.confidence > top.confidence ? item : top), null);

      if (best) {
        level = Math.min(1, level + (dt / RISE_MS) * (0.5 + best.confidence * 0.5));
        activeHand = best.trackId;
      } else {
        level = Math.max(0, level - dt / FALL_MS);
      }

      if (!present && level >= ON) present = true;
      else if (present && level <= OFF) present = false;

      const decay = Math.exp(-dt / VOTE_DECAY_MS);
      for (const [id, vote] of votes) {
        const next = { ...vote, weight: vote.weight * decay };
        if (next.weight < 0.02) votes.delete(id);
        else votes.set(id, next);
      }
      if (best) {
        const vote = votes.get(best.id);
        votes.set(best.id, {
          label: best.label,
          weight: (vote?.weight ?? 0) + best.confidence,
        });
        // Mulai dari nilai pertama, bukan dari 0, supaya persentase awal tidak menyesatkan.
        confidence = confidence > 0 ? confidence + (best.confidence - confidence) * 0.3 : best.confidence;
      } else if (!present) {
        confidence = 0;
      }

      let top = null;
      for (const [id, vote] of votes) {
        if (!top || vote.weight > top.weight) top = { id, ...vote };
      }
      if (!present) activeHand = best ? activeHand : null;

      return {
        present,
        level,
        id: present && top ? top.id : null,
        label: present && top ? top.label : "",
        confidence: present ? confidence : 0,
        trackId: present ? activeHand : null,
      };
    },

    reset() {
      level = 0;
      present = false;
      last = null;
      confidence = 0;
      activeHand = null;
      votes.clear();
    },
  };
}
