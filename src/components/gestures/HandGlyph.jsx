/** @format */

// Kerangka landmark tangan ala MediaPipe (viewBox 64 × 64), dibentuk per gestur.
const WRIST = [32, 58];

const FINGERS = [
  { name: "index", mcp: [24.5, 33], angle: -10, bones: [8.5, 5.5, 4.5] },
  { name: "middle", mcp: [31.5, 31], angle: 0, bones: [9.5, 6, 5] },
  { name: "ring", mcp: [38, 33], angle: 9, bones: [9, 5.5, 4.5] },
  { name: "pinky", mcp: [43.5, 37], angle: 20, bones: [7, 4.5, 3.5] },
];

const THUMBS = {
  out: [
    [26.5, 52],
    [21, 47],
    [16.5, 42.5],
    [13, 38.5],
  ],
  side: [
    [26.5, 52],
    [20.5, 48.5],
    [15, 47],
    [10, 46.5],
  ],
  tucked: [
    [26.5, 52],
    [22.5, 46.5],
    [25.5, 42.5],
    [30.5, 40.5],
  ],
};

// open = jari yang lurus beserta sudutnya (derajat dari vertikal); sisanya menekuk.
const POSES = {
  open_palm: {
    open: { index: -15, middle: -3, ring: 10, pinky: 24 },
    thumb: "out",
  },
  fist: { open: {}, thumb: "tucked" },
  pointing_up: { open: { index: -4 }, thumb: "tucked" },
  peace: { open: { index: -16, middle: 9 }, thumb: "tucked" },
  ily: { open: { index: -8, pinky: 26 }, thumb: "out" },
  call_me: { open: { pinky: 30 }, thumb: "side" },
  thumbs_up: { open: {}, thumb: "side", rotate: 90 },
  thumbs_down: { open: {}, thumb: "side", rotate: -90 },
};

// Dua tangan membentuk hati: ujung jempol di bawah, ujung telunjuk di lekuk atas.
const HEART = {
  outline: [
    [32, 54],
    [21.5, 44.5],
    [13, 33.5],
    [13.5, 22.5],
    [20, 15.5],
    [27.5, 16.5],
    [32, 22],
    [36.5, 16.5],
    [44, 15.5],
    [50.5, 22.5],
    [51, 33.5],
    [42.5, 44.5],
    [32, 54],
  ],
  arms: [
    [
      [21.5, 44.5],
      [14, 60],
    ],
    [
      [42.5, 44.5],
      [50, 60],
    ],
  ],
  tips: [0, 6],
};

function fingerPoints({ mcp, angle, bones }, openAngle) {
  const extended = openAngle !== undefined;
  const radians = ((extended ? openAngle : angle) * Math.PI) / 180;
  const along = [Math.sin(radians), -Math.cos(radians)];
  const across = [Math.cos(radians), Math.sin(radians)];
  const at = (distance, side = 0) => [
    mcp[0] + along[0] * distance + across[0] * side,
    mcp[1] + along[1] * distance + across[1] * side,
  ];

  // Tampak depan, jari yang menekuk hanya terlihat sebagai puntung pendek.
  if (!extended) return [mcp, at(3.2)];

  let reach = 0;
  return [mcp, ...bones.map((length) => at((reach += length)))];
}

function rotate([x, y], degrees) {
  const radians = (degrees * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return [
    32 + (x - 32) * cos - (y - 40) * sin,
    40 + (x - 32) * sin + (y - 40) * cos,
  ];
}

const round = (value) => Math.round(value * 100) / 100;

// Skala seragam supaya tiap gestur mengisi kotak dengan margin yang sama.
function fit(chains, size = 50) {
  const all = chains.flat();
  const xs = all.map(([x]) => x);
  const ys = all.map(([, y]) => y);
  const [minX, maxX, minY, maxY] = [
    Math.min(...xs),
    Math.max(...xs),
    Math.min(...ys),
    Math.max(...ys),
  ];
  const scale = Math.min(size / (maxX - minX), size / (maxY - minY), 1.6);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  return chains.map((chain) =>
    chain.map(([x, y]) => [
      round(32 + (x - cx) * scale),
      round(32 + (y - cy) * scale),
    ]),
  );
}

function joints(lines, exclude) {
  const skip = new Set(exclude.map((point) => point.join()));
  const seen = new Map();
  lines.flat().forEach((point) => {
    const key = point.join();
    if (!skip.has(key)) seen.set(key, point);
  });
  return [...seen.values()];
}

function buildHand({ open, thumb, rotate: degrees }) {
  const turn = (point) => (degrees ? rotate(point, degrees) : point);
  const chains = [
    [WRIST, ...THUMBS[thumb]],
    [WRIST, ...FINGERS.map((finger) => finger.mcp), WRIST],
    ...FINGERS.map((finger) => fingerPoints(finger, open[finger.name])),
  ].map((chain) => chain.map(turn));

  const lines = fit(chains);
  const [thumbLine, palm, ...fingerLines] = lines;
  const tips = fingerLines
    .filter((_, index) => open[FINGERS[index].name] !== undefined)
    .map((line) => line.at(-1));
  if (thumb !== "tucked") tips.unshift(thumbLine.at(-1));
  const origins = [palm[0]];

  return { lines, tips, origins, joints: joints(lines, [...tips, ...origins]) };
}

function buildHeart() {
  const lines = fit([HEART.outline, ...HEART.arms]);
  const tips = HEART.tips.map((index) => lines[0][index]);
  const origins = lines.slice(1).map((arm) => arm.at(-1));
  return { lines, tips, origins, joints: joints(lines, [...tips, ...origins]) };
}

const GLYPHS = {
  ...Object.fromEntries(
    Object.entries(POSES).map(([pose, spec]) => [pose, buildHand(spec)]),
  ),
  heart: buildHeart(),
};

const toPoints = (points) => points.map((point) => point.join(",")).join(" ");

export default function HandGlyph({ pose, className = "" }) {
  const glyph = GLYPHS[pose] ?? GLYPHS.open_palm;

  return (
    <svg
      viewBox="0 0 64 64"
      className={`dtc-hand ${className}`.trim()}
      aria-hidden="true"
      focusable="false"
    >
      {glyph.lines.map((line) => (
        <polyline key={toPoints(line)} points={toPoints(line)} />
      ))}
      {glyph.joints.map(([x, y]) => (
        <circle key={`j${x},${y}`} cx={x} cy={y} r={1.15} />
      ))}
      {glyph.origins.map(([x, y]) => (
        <circle
          key={`o${x},${y}`}
          cx={x}
          cy={y}
          r={2.3}
          className="dtc-hand__origin"
        />
      ))}
      {glyph.tips.map(([x, y]) => (
        <circle
          key={`t${x},${y}`}
          cx={x}
          cy={y}
          r={2.6}
          className="dtc-hand__tip"
        />
      ))}
    </svg>
  );
}
