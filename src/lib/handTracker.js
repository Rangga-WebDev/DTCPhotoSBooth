/**
 * PELACAK TANGAN
 *   - ID tetap per tangan antar-frame (dicocokkan dari posisi pergelangan).
 *   - Landmark dihaluskan dengan One Euro filter: diam = stabil, bergerak = tetap responsif.
 *   - Gerakan diukur dalam "tinggi tangan per detik" supaya sama di jarak dekat maupun jauh.
 *
 * @format
 */

const MATCH_RADIUS = 2.5; // dalam satuan tinggi tangan
const TRACK_TTL_MS = 600;
const EDGE = 0.012;

function alpha(cutoff, dt) {
  const r = 2 * Math.PI * cutoff * dt;
  return r / (r + 1);
}

function createOneEuro({ minCutoff = 1.4, beta = 10, dCutoff = 1 } = {}) {
  let value = null;
  let speed = 0;
  let last = 0;
  return (next, now) => {
    if (value === null) {
      value = next;
      last = now;
      return value;
    }
    const dt = Math.max(0.001, (now - last) / 1000);
    last = now;
    speed += alpha(dCutoff, dt) * ((next - value) / dt - speed);
    value += alpha(minCutoff + beta * Math.abs(speed), dt) * (next - value);
    return value;
  };
}

export function boxOf(points) {
  let left = Infinity;
  let right = -Infinity;
  let top = Infinity;
  let bottom = -Infinity;
  for (const point of points) {
    if (point.x < left) left = point.x;
    if (point.x > right) right = point.x;
    if (point.y < top) top = point.y;
    if (point.y > bottom) bottom = point.y;
  }
  return { left, right, top, bottom, w: right - left, h: bottom - top };
}

function createTrack(id) {
  return {
    id,
    fx: Array.from({ length: 21 }, () => createOneEuro()),
    fy: Array.from({ length: 21 }, () => createOneEuro()),
    wrist: null,
    size: 0,
    motion: 0,
    seen: 0,
  };
}

export function createHandTracker() {
  let tracks = [];
  let nextId = 1;

  return {
    // hands: [{ points, world, … }] dalam koordinat frame penuh (0–1).
    update(hands, now, aspect = 16 / 9) {
      const used = new Set();

      const output = hands.map((hand) => {
        const box = boxOf(hand.points);
        const wrist = hand.points[0];
        const scale = Math.max(box.h, 0.02);

        let match = null;
        let nearest = Infinity;
        for (const track of tracks) {
          if (used.has(track) || !track.wrist) continue;
          const gap =
            Math.hypot((wrist.x - track.wrist.x) * aspect, wrist.y - track.wrist.y) /
            Math.max(track.size, scale);
          if (gap < nearest) {
            nearest = gap;
            match = track;
          }
        }
        if (!match || nearest > MATCH_RADIUS) {
          match = createTrack(nextId++);
          tracks.push(match);
        }
        used.add(match);

        if (match.wrist && match.seen) {
          const dt = (now - match.seen) / 1000;
          if (dt > 0) {
            const travel = Math.hypot(
              (wrist.x - match.wrist.x) * aspect,
              wrist.y - match.wrist.y,
            );
            match.motion += (travel / scale / dt - match.motion) * 0.35;
          }
        }
        match.wrist = { x: wrist.x, y: wrist.y };
        match.size = match.size ? match.size + (box.h - match.size) * 0.3 : box.h;
        match.seen = now;

        const smooth = hand.points.map((point, index) => ({
          x: match.fx[index](point.x, now),
          y: match.fy[index](point.y, now),
        }));
        const edge =
          box.left < EDGE || box.right > 1 - EDGE || box.top < EDGE || box.bottom > 1 - EDGE;

        return {
          ...hand,
          trackId: match.id,
          smooth,
          box,
          size: match.size,
          motion: match.motion,
          edge,
        };
      });

      tracks = tracks.filter((track) => used.has(track) || now - track.seen < TRACK_TTL_MS);
      return output;
    },

    reset() {
      tracks = [];
    },
  };
}
