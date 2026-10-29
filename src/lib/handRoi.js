/** @format */

// Jendela analisis dalam koordinat frame penuh (0–1). Lebar & tinggi memakai pecahan yang sama,
// jadi rasio frame tetap dan landmark bisa dipetakan balik tanpa distorsi.
const WIDE = { x: 0, y: 0, w: 1, h: 1 };
// Palm detector MediaPipe (input 192 px) sering melewatkan telapak kecil di frame penuh,
// jadi saat kosong area zoom yang paling mungkin (tengah) dikunjungi tiap dua langkah.
// Setelah tangan tertangkap, tracking landmark tetap jalan walau kembali ke wide.
const SCAN = ["center", "left", "center", "right", "center", "wide"];
const ANCHORS = { center: [0.5, 0.45], left: [0.3, 0.45], right: [0.7, 0.45] };
const SCAN_SIZE = 0.58;
// Pindah area setelah 2 frame analisis (dan minimal 300 ms), bukan per detik,
// supaya satu putaran pindai selesai cepat di laptop lambat maupun cepat.
const DWELL_FRAMES = 2;
const DWELL_MIN_MS = 300;
const LOST_MS = 900;
// Tangan < 14% tinggi frame dianggap jauh (± 1,7 m ke atas pada webcam 70°).
const FAR_HAND = 0.14;
// Zoom diatur agar tangan mengisi ± 25% jendela; lebih dari 45% berarti orangnya sudah dekat.
const TARGET_FILL = 0.25;
const NEAR_FILL = 0.45;
const MIN_SIZE = 0.4;
const MAX_SIZE = 0.75;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function around(cx, cy, size) {
  return {
    x: clamp(cx - size / 2, 0, 1 - size),
    y: clamp(cy - size / 2, 0, 1 - size),
    w: size,
    h: size,
  };
}

function box(points) {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  return {
    left: Math.min(...xs),
    right: Math.max(...xs),
    top: Math.min(...ys),
    bottom: Math.max(...ys),
  };
}

// Kotak gabungan semua tangan (untuk posisi zoom) + tinggi tangan terbesar (untuk jarak).
export function boundsOf(hands) {
  const boxes = hands
    .map((hand) => hand.points ?? [])
    .filter((points) => points.length)
    .map(box);
  if (!boxes.length) return null;

  const left = Math.min(...boxes.map((item) => item.left));
  const right = Math.max(...boxes.map((item) => item.right));
  const top = Math.min(...boxes.map((item) => item.top));
  const bottom = Math.max(...boxes.map((item) => item.bottom));

  return {
    w: right - left,
    h: bottom - top,
    cx: (left + right) / 2,
    cy: (top + bottom) / 2,
    hand: Math.max(...boxes.map((item) => item.bottom - item.top)),
  };
}

// Wide saat tangan dekat; zoom mengikuti tangan yang jauh; pindai tengah/kiri/kanan saat kosong.
export function createRoiTracker() {
  let mode = "wide";
  let rect = WIDE;
  let step = -1;
  let stepSince = 0;
  let stepFrames = 0;
  let lastSeen = -Infinity;
  let follow = null;

  return {
    current() {
      return { mode, rect, zoom: Math.round(10 / rect.w) / 10 };
    },

    update(now, box) {
      if (box) {
        lastSeen = now;
        const target = clamp(
          Math.max(box.hand / TARGET_FILL, box.w / 0.8, box.h / 0.8),
          MIN_SIZE,
          MAX_SIZE,
        );

        if (mode === "wide") {
          if (box.hand < FAR_HAND && box.w < MAX_SIZE) {
            follow = { cx: box.cx, cy: box.cy, size: target };
            mode = "follow";
          }
        } else {
          follow ??= { cx: box.cx, cy: box.cy, size: rect.w };
          follow.cx += (box.cx - follow.cx) * 0.3;
          follow.cy += (box.cy - follow.cy) * 0.3;
          follow.size += (target - follow.size) * 0.2;
          mode = "follow";

          if (box.hand > NEAR_FILL * follow.size || box.w > MAX_SIZE) {
            mode = "wide";
            follow = null;
          }
        }
      } else if (now - lastSeen > LOST_MS) {
        follow = null;
        stepFrames += 1;
        if (step < 0 || (stepFrames > DWELL_FRAMES && now - stepSince >= DWELL_MIN_MS)) {
          step = (step + 1) % SCAN.length;
          stepSince = now;
          stepFrames = 1;
        }
        mode = SCAN[step];
      }

      rect =
        mode === "wide"
          ? WIDE
          : mode === "follow"
            ? around(follow.cx, follow.cy, follow.size)
            : around(...ANCHORS[mode], SCAN_SIZE);
    },
  };
}
