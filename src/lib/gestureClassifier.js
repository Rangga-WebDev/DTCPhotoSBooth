/**
 * KLASIFIKASI GESTUR (ensemble)
 *   1. Model bawaan MediaPipe (Victory, Thumb_Up, ILoveYou, …).
 *   2. Geometri 3D: sudut tekuk tiap jari dari worldLandmarks (satuan meter, jadi
 *      tidak terpengaruh jarak ke kamera atau rotasi tangan).
 *   Keduanya digabung: setuju → keyakinan naik; model ragu tapi geometri yakin pada
 *   pose khas → geometri menang. Pose yang mirip tangan santai (telapak terbuka,
 *   kepalan) hanya dihitung kalau tangan benar-benar diangkat.
 *
 *   Landmark: 0 pergelangan · 1–4 jempol · 5–8 telunjuk · 9–12 tengah · 13–16 manis · 17–20 kelingking
 *
 * @format
 */

import { GESTURES } from "../data/gestures";

const LABELS = Object.fromEntries(
  GESTURES.map((gesture) => [gesture.id, gesture.label]),
);

const CANNED = {
  Thumb_Up: "thumbs_up",
  Thumb_Down: "thumbs_down",
  Victory: "peace",
  ILoveYou: "ily",
  Open_Palm: "open_palm",
  Closed_Fist: "fist",
  Pointing_Up: "pointing_up",
};

const FINGERS = {
  index: [5, 6, 7, 8],
  middle: [9, 10, 11, 12],
  ring: [13, 14, 15, 16],
  pinky: [17, 18, 19, 20],
};

// Pose khas yang jarang terbentuk tanpa sengaja: geometri boleh mengoreksi model.
const DISTINCT = new Set([
  "peace",
  "call_me",
  "ily",
  "pointing_up",
  "thumbs_up",
  "thumbs_down",
]);
// Mirip tangan santai di samping badan: butuh keyakinan tinggi + tangan terangkat.
const AMBIGUOUS = new Set(["open_palm", "fist"]);

const clamp01 = (value) => Math.max(0, Math.min(1, value));
const vec = (a, b) => [b.x - a.x, b.y - a.y, (b.z ?? 0) - (a.z ?? 0)];
const length = (v) => Math.hypot(v[0], v[1], v[2]);
const distance3 = (a, b) => length(vec(a, b));

function angle(u, v) {
  const size = length(u) * length(v);
  if (!size) return 0;
  const cos = (u[0] * v[0] + u[1] * v[1] + u[2] * v[2]) / size;
  return (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI;
}

// Total tekukan di sendi MCP + PIP + DIP (derajat): lurus ±10–50°, menggenggam ±180°+.
function fingerBend(p, [mcp, pip, dip, tip]) {
  const base = vec(p[0], p[mcp]);
  const b1 = vec(p[mcp], p[pip]);
  const b2 = vec(p[pip], p[dip]);
  const b3 = vec(p[dip], p[tip]);
  return angle(base, b1) + angle(b1, b2) + angle(b2, b3);
}

// Skor 0–1 per jari: 1 = lurus, 0 = menekuk penuh.
export function handPose(hand) {
  const p = hand.world ?? hand.points;
  const palm = Math.max(distance3(p[0], p[9]), 1e-6);
  const pose = {};
  for (const [name, joints] of Object.entries(FINGERS)) {
    pose[name] = clamp01((165 - fingerBend(p, joints)) / 110);
  }
  const thumbBend =
    angle(vec(p[1], p[2]), vec(p[2], p[3])) +
    angle(vec(p[2], p[3]), vec(p[3], p[4]));
  const reach = distance3(p[4], p[5]) / palm;
  pose.thumb = clamp01((reach - 0.35) / 0.35) * clamp01((110 - thumbBend) / 60);
  return pose;
}

// Arah ruas tangan di layar (y ke bawah); x dikali aspect supaya sudutnya benar.
function upness(points, from, to, aspect) {
  const dx = (points[to].x - points[from].x) * aspect;
  const dy = points[to].y - points[from].y;
  return -dy / (Math.hypot(dx, dy) || 1);
}

export function geometricGesture(hand, aspect) {
  const f = handPose(hand);
  const curl = (value) => 1 - value;
  const fourCurled = Math.min(
    curl(f.index),
    curl(f.middle),
    curl(f.ring),
    curl(f.pinky),
  );
  const thumbUp = upness(hand.points, 2, 4, aspect);
  const indexUp = upness(hand.points, 5, 8, aspect);

  const scores = {
    peace: Math.min(f.index, f.middle, curl(f.ring), curl(f.pinky)),
    call_me: Math.min(f.thumb, f.pinky, curl(f.index), curl(f.middle), curl(f.ring)),
    ily: Math.min(f.thumb, f.index, f.pinky, curl(f.middle), curl(f.ring)),
    pointing_up: Math.min(
      f.index,
      curl(f.middle),
      curl(f.ring),
      curl(f.pinky),
      clamp01((indexUp - 0.5) / 0.35),
    ),
    open_palm: Math.min(f.index, f.middle, f.ring, f.pinky, f.thumb),
    fist: Math.min(fourCurled, curl(f.thumb)),
    thumbs_up: Math.min(f.thumb, fourCurled, clamp01((thumbUp - 0.55) / 0.35)),
    thumbs_down: Math.min(f.thumb, fourCurled, clamp01((-thumbUp - 0.55) / 0.35)),
  };

  let best = { id: null, score: 0 };
  for (const [id, score] of Object.entries(scores)) {
    if (score > best.score) best = { id, score };
  }
  return { ...best, pose: f };
}

// Pangkal jari tengah di atas pergelangan = tangan diangkat, bukan menggantung di samping badan.
function isRaised(points) {
  return points[9].y < points[0].y && points[0].y < 0.97;
}

const result = (id, confidence, source) => ({
  id,
  label: LABELS[id] ?? id,
  confidence: Math.min(0.99, confidence),
  source,
});

export function classifyHand(hand, aspect = 16 / 9) {
  const canned = CANNED[hand.category] ?? null;
  const model = canned ? hand.score : 0;
  const geo = geometricGesture(hand, aspect);
  let found = null;

  // "Telepon" tidak ada di model bawaan; model sering menyebutnya ILoveYou atau None.
  if (geo.id === "call_me" && geo.score >= 0.65) {
    found = result("call_me", 0.7 + 0.25 * geo.score, "geometry");
  } else if (canned && model >= 0.5) {
    if (geo.id === canned && geo.score >= 0.5) {
      found = result(canned, model + 0.12, "both");
    } else if (DISTINCT.has(geo.id) && geo.score >= 0.8 && model < 0.65) {
      found = result(geo.id, 0.7, "geometry");
    } else {
      found = result(canned, model, "model");
    }
  } else if (DISTINCT.has(geo.id) && geo.score >= 0.75) {
    found = result(geo.id, 0.55 + 0.3 * geo.score, "geometry");
  }

  if (!found) return null;
  if (AMBIGUOUS.has(found.id) && (found.confidence < 0.7 || !isRaised(hand.points))) {
    return null;
  }
  return found;
}

// Dua tangan membentuk hati: jempol bertemu di bawah, telunjuk bertemu di atas.
export function isHeart(first, second, aspect = 16 / 9) {
  const a = first.points;
  const b = second.points;
  if (!a || !b || a.length < 21 || b.length < 21) return false;

  const d = (p, q) => Math.hypot((p.x - q.x) * aspect, p.y - q.y);
  const palm = (p) => Math.max(d(p[0], p[9]), d(p[5], p[17]), 1e-4);
  const size = (palm(a) + palm(b)) / 2;

  const thumbsNear = d(a[4], b[4]) < size * 1.1;
  const indexesNear = d(a[8], b[8]) < size * 1.3;
  const indexesAbove = (a[8].y + b[8].y) / 2 < (a[4].y + b[4].y) / 2;
  const wristsApart = d(a[0], b[0]) > size * 0.75;

  return thumbsNear && indexesNear && indexesAbove && wristsApart;
}

// Gestur tiap tangan + pasangan hati. Mengembalikan kandidat untuk smoothing.
export function recognizeHands(hands, aspect = 16 / 9) {
  hands.forEach((hand) => {
    hand.gesture = classifyHand(hand, aspect);
  });

  for (let i = 0; i < hands.length; i++) {
    for (let j = i + 1; j < hands.length; j++) {
      if (isHeart(hands[i], hands[j], aspect)) {
        const heart = result("heart", 0.9, "geometry");
        hands[i].gesture = heart;
        hands[j].gesture = heart;
      }
    }
  }

  return hands
    .filter((hand) => hand.gesture)
    .map((hand) => ({ ...hand.gesture, trackId: hand.trackId }));
}
