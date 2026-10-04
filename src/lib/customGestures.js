/**
 * CUSTOM GESTURES
 *   DTCBooth AI Photobooth
 *
 *   MediaPipe landmarks:
 *   0  = wrist
 *   4  = thumb tip
 *   5  = index MCP
 *   8  = index tip
 *   9  = middle MCP
 *   12 = middle tip
 *   13 = ring MCP
 *   16 = ring tip
 *   17 = pinky MCP
 *   20 = pinky tip
 *
 * @format
 */

// Jarak antara dua titik
function distance(a, b) {
  if (!a || !b) return Infinity;

  return Math.hypot(a.x - b.x, a.y - b.y);
}

// Ukuran telapak untuk menormalisasi jarak
function palmSize(lm) {
  if (!lm || lm.length < 21) return 0;

  return Math.max(distance(lm[0], lm[9]), distance(lm[5], lm[17]), 0.001);
}

// Memeriksa jari terbuka berdasarkan jarak
// ujung jari ke pangkal telapak.
function fingerExtended(lm, tip, pip, mcp) {
  if (!lm || lm.length < 21) return false;

  const tipDistance = distance(lm[tip], lm[0]);
  const pipDistance = distance(lm[pip], lm[0]);

  const tipToMcp = distance(lm[tip], lm[mcp]);
  const pipToMcp = distance(lm[pip], lm[mcp]);

  return tipDistance > pipDistance * 1.08 && tipToMcp > pipToMcp * 1.15;
}

// Deteksi CALL ME 🤙
// Ibu jari dan kelingking terbuka.
// Telunjuk, tengah, dan manis tertutup.
export function detectCallMe(lm) {
  if (!lm || lm.length < 21) return false;

  const size = palmSize(lm);

  const thumbOpen = distance(lm[4], lm[17]) > distance(lm[3], lm[17]) * 1.12;

  const pinkyOpen = fingerExtended(lm, 20, 18, 17);

  const indexClosed = !fingerExtended(lm, 8, 6, 5);

  const middleClosed = !fingerExtended(lm, 12, 10, 9);

  const ringClosed = !fingerExtended(lm, 16, 14, 13);

  const thumbPinkySpread = distance(lm[4], lm[20]) > size * 1.5;

  return (
    thumbOpen &&
    pinkyOpen &&
    indexClosed &&
    middleClosed &&
    ringClosed &&
    thumbPinkySpread
  );
}

// Deteksi HEART HANDS 🫶
// Kedua ibu jari berdekatan,
// kedua telunjuk mendekat,
// dan tangan membentuk ruang di tengah.
//
// Ini adalah pendekatan geometris.
// Pose dengan telapak menghadap kamera
// dan kedua tangan sejajar akan lebih mudah dikenali.
export function detectHeartHands(left, right) {
  if (!left || !right || left.length < 21 || right.length < 21) {
    return false;
  }

  // Urutkan berdasarkan posisi horizontal
  // agar tidak bergantung pada label Left/Right
  const handA = left[0].x < right[0].x ? left : right;

  const handB = left[0].x < right[0].x ? right : left;

  const size = (palmSize(handA) + palmSize(handB)) / 2;

  // Kedua ujung ibu jari mendekat di bawah
  const thumbsNear = distance(handA[4], handB[4]) < size * 0.95;

  // Kedua ujung telunjuk mendekat di atas
  const indexesNear = distance(handA[8], handB[8]) < size * 1.15;

  // Ujung telunjuk berada di atas ibu jari
  // Koordinat Y browser mengecil ke arah atas
  const indexesAboveThumbs =
    (handA[8].y + handB[8].y) / 2 < (handA[4].y + handB[4].y) / 2;

  // Pergelangan kedua tangan terpisah
  const wristsApart = distance(handA[0], handB[0]) > size * 0.75;

  return thumbsNear && indexesNear && indexesAboveThumbs && wristsApart;
}

// Menggabungkan hasil custom gesture
// dengan hasil MediaPipe bawaan.
export function recognizeCustomGestures(hands) {
  if (!hands || hands.length === 0) {
    return [];
  }

  const results = hands.map((hand) => {
    if (detectCallMe(hand.landmarks)) {
      return {
        ...hand,
        id: "call_me",
        label: "Telepon",
        emoji: "🤙",
        confidence: 0.9,
      };
    }

    return hand;
  });

  // Pasangan tangan mana pun (maks. 4 tangan) bisa membentuk hati.
  for (let a = 0; a < hands.length; a++) {
    for (let b = a + 1; b < hands.length; b++) {
      if (detectHeartHands(hands[a].landmarks, hands[b].landmarks)) {
        return [
          {
            id: "heart",
            label: "Bentuk Love",
            emoji: "🫶",
            confidence: 0.9,
            landmarks: [],
            handedness: "Both",
          },
          ...results.filter((_, index) => index !== a && index !== b),
        ];
      }
    }
  }

  return results;
}
