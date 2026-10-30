/**
 * DESAIN PHOTOCARD CIA (Civil In Action)
 *   Semua bertema teknik sipil dan berjudul besar CIVIL IN ACTION.
 *   Kartu 4R 1200 × 1800 px; foto diisi ke area body oleh layouts.js.
 *
 * @format
 */

import {
  C,
  TITLE,
  bigTitle,
  display,
  drawPhotos,
  label,
  pad2,
  photoBounds,
  specRow,
  title,
} from "./common";

/* ---------- ornamen bersama ---------- */

function bolt(kit, x, y, r) {
  kit.circle(x, y, r, "#7A7F88", "#15161A", 2);
}

// Balok baja profil WF tampak samping: flens atas/bawah, badan, baut, pelat pengaku merah.
function beam(kit, { y, h, plates = true }) {
  const { W } = kit;
  const flange = Math.round(h * 0.1);
  kit.fill("#2A2D33", 0, y + flange, W, h - flange * 2);
  kit.fill("#4B4F58", 0, y, W, flange);
  kit.fill("#4B4F58", 0, y + h - flange, W, flange);
  kit.line(0, y + 1, W, y + 1, "rgba(255, 255, 255, 0.2)", 2);
  kit.line(0, y + flange, W, y + flange, "rgba(0, 0, 0, 0.55)", 2);
  kit.line(0, y + h - flange, W, y + h - flange, "rgba(0, 0, 0, 0.55)", 2);
  if (plates) {
    [70, W - 86].forEach((x) => kit.fill(C.red, x, y + flange, 16, h - flange * 2));
  }
  for (let x = 30; x < W; x += 60) {
    bolt(kit, x, y + flange / 2, Math.max(3, flange * 0.22));
    bolt(kit, x, y + h - flange / 2, Math.max(3, flange * 0.22));
  }
}

// Pita pembatas proyek melintang (miring), berisi teks berulang atau papan label.
function tape(kit, { y, angle, text, hazard = false }) {
  const { W, ctx } = kit;
  ctx.save();
  ctx.translate(W / 2, y);
  ctx.rotate((angle * Math.PI) / 180);
  if (hazard) kit.hazard(-W, -36, W * 2, 72, C.red, C.black, 26);
  else kit.fill(C.red, -W, -36, W * 2, 72);
  kit.fill(C.black, -W, -36, W * 2, 6);
  kit.fill(C.black, -W, 30, W * 2, 6);

  if (hazard) {
    const options = label(26, C.ink, { weight: 700, align: "center" });
    const width = kit.measure(text, options) + 48;
    kit.fill(C.white, -width / 2, -26, width, 52);
    kit.text(text, 0, 10, options);
  } else {
    const options = label(26, C.white, { weight: 700 });
    const unit = `${text}   ·   `;
    const step = kit.measure(unit, options);
    for (let x = -W; x < W; x += step) kit.text(unit, x, 10, options);
  }
  ctx.restore();
}

function truss(kit, { left, right, top, deck, panels }) {
  const step = (right - left) / panels;
  kit.fill(C.ink, left - 6, deck + 14, 44, 46);
  kit.fill(C.ink, right - 38, deck + 14, 44, 46);
  kit.fill(C.red, left - 30, deck, right - left + 60, 16);
  kit.line(left + step, top, right - step, top, C.ink, 8);
  kit.line(left, deck, left + step, top, C.ink, 8);
  kit.line(right, deck, right - step, top, C.ink, 8);
  for (let i = 1; i < panels; i++) {
    kit.line(left + step * i, top, left + step * i, deck, C.ink, 3);
  }
  // Rangka Pratt: diagonal turun ke arah tengah bentang.
  for (let i = 1; i < panels - 1; i++) {
    const x1 = left + step * i;
    const x2 = left + step * (i + 1);
    if (i < panels / 2) kit.line(x1, top, x2, deck, C.ink, 3);
    else kit.line(x1, deck, x2, top, C.ink, 3);
  }
}

function waves(kit, y, color) {
  const { W, ctx } = kit;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  for (let row = 0; row < 3; row++) {
    ctx.beginPath();
    for (let x = 0; x <= W; x += 8) {
      const value = y + row * 18 + Math.sin((x + row * 40) / 38) * 5;
      if (x === 0) ctx.moveTo(x, value);
      else ctx.lineTo(x, value);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function contours(kit, { cx, cy, base, rings, color }) {
  const { ctx, random } = kit;
  const phase = random() * Math.PI * 2;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  for (let ring = 1; ring <= rings; ring++) {
    const radius = base * ring * 0.62 + ring * 8;
    ctx.beginPath();
    for (let step = 0; step <= 72; step++) {
      const t = (step / 72) * Math.PI * 2;
      const wobble =
        1 + 0.12 * Math.sin(3 * t + phase + ring * 0.35) + 0.06 * Math.sin(5 * t - phase);
      const x = cx + Math.cos(t) * radius * 1.35 * wobble;
      const y = cy + Math.sin(t) * radius * wobble;
      if (step === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  }
  ctx.restore();
}

function northArrow(kit, x, y) {
  kit.circle(x, y, 54, null, C.ink, 2);
  kit.polygon([[x, y - 46], [x + 20, y + 22], [x, y + 8]], C.ink);
  kit.polygon([[x, y - 46], [x - 20, y + 22], [x, y + 8]], C.white, C.ink, 2);
  kit.text("U", x, y + 90, display(34, C.ink, { align: "center" }));
}

function reticle(kit, slot) {
  const inset = 18;
  const size = Math.min(56, slot.w * 0.09);
  const x1 = slot.x + inset;
  const y1 = slot.y + inset;
  const x2 = slot.x + slot.w - inset;
  const y2 = slot.y + slot.h - inset;
  [
    [x1, y1, 1, 1],
    [x2, y1, -1, 1],
    [x1, y2, 1, -1],
    [x2, y2, -1, -1],
  ].forEach(([x, y, dx, dy]) => {
    kit.line(x, y, x + size * dx, y, C.white, 4);
    kit.line(x, y, x, y + size * dy, C.white, 4);
  });
}

function dms(prefix, value) {
  const degrees = Math.floor(value);
  const minutesFull = (value - degrees) * 60;
  const minutes = Math.floor(minutesFull);
  const seconds = Math.round((minutesFull - minutes) * 60) % 60;
  return `${prefix} ${pad2(degrees)}°${pad2(minutes)}'${pad2(seconds)}"`;
}

function qcStamp(kit, x, y) {
  const { ctx } = kit;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.12);
  kit.roundRect(-124, -50, 248, 100, 8, "rgba(244, 242, 238, 0.9)", C.red, 5);
  kit.text("QC LOLOS", 0, 4, display(44, C.red, { align: "center" }));
  kit.text("UJI TEKAN OK", 0, 34, label(18, C.red, { align: "center", weight: 700 }));
  ctx.restore();
}

/* ---------- desain ---------- */

const poster = {
  id: "cia-poster",
  name: "Poster",
  note: "Hitam-merah ala poster acara dengan judul CIVIL IN ACTION besar.",
  layout: "auto",
  spacing: () => ({ top: 500, side: 72, gap: 22, bottom: 270 }),
  draw(kit, images, layout) {
    const { W, H, stamp } = kit;
    kit.fill(C.black);
    kit.hazard(0, 0, W, 26, C.red, C.black, 30);

    kit.text("CIA PHOTOBOOTH", 72, 98, label(28, C.white, { weight: 700 }));
    kit.text("TEKNIK SIPIL", 72, 132, label(22, C.muted));
    kit.text(`N° ${stamp.session}`, W - 72, 98, label(28, C.red, { weight: 700, align: "right" }));
    kit.text(stamp.shortDate.toUpperCase(), W - 72, 132, label(22, C.muted, { align: "right" }));

    const markWidth = 240;
    kit.logo({ x: W - 72, y: 186, w: markWidth, align: "right", ink: C.inkOnDark });
    bigTitle(kit, {
      x: 64,
      top: 176,
      width: W - 128 - markWidth - 40,
      lines: ["CIVIL IN", "ACTION"],
      colors: [C.white, C.red],
      size: 200,
      gap: 18,
    });

    drawPhotos(kit, images, layout, {
      after: (slot, index) => {
        kit.strokeRect(slot.x, slot.y, slot.w, slot.h, C.white, 2);
        kit.fill(C.red, slot.x, slot.y, 60, 38);
        kit.text(
          pad2(index + 1),
          slot.x + 30,
          slot.y + 28,
          label(24, C.white, { weight: 700, align: "center", spacing: 0 }),
        );
      },
    });

    const y = layout.bodyBottom;
    kit.line(72, y + 48, W - 72, y + 48, C.charcoal, 2);
    kit.text(stamp.longDate.toUpperCase(), 72, y + 100, label(24, C.white));
    kit.text(stamp.time, W - 72, y + 100, label(24, C.white, { align: "right" }));
    kit.watermark({ x: 72, y: H - 72, color: C.muted, markInk: C.inkOnDark });
    kit.hazard(0, H - 26, W, 26, C.red, C.black, 30);
  },
};

const drawing = {
  id: "cia-drawing",
  name: "Gambar Kerja",
  note: "Kertas gambar teknik lengkap dengan garis ukur dan kop lembar.",
  layout: "grid",
  spacing: () => ({ top: 400, side: 120, gap: 44, bottom: 400 }),
  draw(kit, images, layout) {
    const { W, H, stamp } = kit;
    kit.fill(C.paper);
    kit.grid("rgba(17, 17, 19, 0.045)", 30, 1, [60, 60, W - 120, H - 120]);
    kit.strokeRect(34, 34, W - 68, H - 68, C.ink, 3);
    kit.strokeRect(60, 60, W - 120, H - 120, C.ink, 1.5);

    // Penanda zona di tepi lembar: angka di atas/bawah, huruf di kiri/kanan.
    const cols = 4;
    const rows = 6;
    const colWidth = (W - 120) / cols;
    const rowHeight = (H - 120) / rows;
    const zone = label(18, C.text, { align: "center", spacing: 0 });
    for (let i = 0; i < cols; i++) {
      const cx = 60 + colWidth * (i + 0.5);
      kit.text(String(i + 1), cx, 53, zone);
      kit.text(String(i + 1), cx, H - 41, zone);
      if (i) {
        kit.line(60 + colWidth * i, 34, 60 + colWidth * i, 60, C.ink, 1.5);
        kit.line(60 + colWidth * i, H - 60, 60 + colWidth * i, H - 34, C.ink, 1.5);
      }
    }
    for (let j = 0; j < rows; j++) {
      const cy = 60 + rowHeight * (j + 0.5) + 6;
      kit.text("ABCDEF"[j], 47, cy, zone);
      kit.text("ABCDEF"[j], W - 47, cy, zone);
      if (j) {
        kit.line(34, 60 + rowHeight * j, 60, 60 + rowHeight * j, C.ink, 1.5);
        kit.line(W - 60, 60 + rowHeight * j, W - 34, 60 + rowHeight * j, C.ink, 1.5);
      }
    }

    kit.logo({ x: 100, y: 94, w: 92 });
    title(kit, TITLE, 216, 178, W - 216 - 100, { size: 120, color: C.ink });
    kit.text("GAMBAR KERJA · PHOTOBOOTH TEKNIK SIPIL", 218, 226, label(22, C.red, { weight: 700 }));
    kit.line(100, 262, W - 100, 262, C.ink, 2);
    kit.text(`DWG. CIA-${stamp.session}`, 100, 300, label(20, C.text));
    kit.text(`DETAIL A–${"ABCDEF"[images.length - 1]}`, W - 100, 300, label(20, C.text, { align: "right" }));

    const box = photoBounds(layout);
    kit.dimension(box.left, box.top - 46, box.right, "SKALA 1 : 1", { color: C.ink, bg: C.paper });

    drawPhotos(kit, images, layout, {
      border: 3,
      borderColor: C.ink,
      after: (slot, index) => {
        kit.circle(slot.x, slot.y, 26, C.paper, C.ink, 3);
        kit.text("ABCDEF"[index], slot.x, slot.y + 10, display(30, C.red, { align: "center" }));
      },
    });

    const top = layout.bodyBottom + 60;
    const left = 100;
    const right = W - 100;
    const markCell = 190;
    kit.fill(C.white, left, top, right - left, 240);
    kit.line(left, top + 110, right - markCell, top + 110, C.ink, 1.5);
    kit.fill(C.red, right - markCell, top, markCell, 240);
    kit.strokeRect(left, top, right - left, 240, C.ink, 3);
    kit.logo({ x: right - markCell / 2, y: top + 34, w: 106, color: C.white, align: "center" });
    kit.text("CIA", right - markCell / 2, top + 212, display(34, C.white, { align: "center" }));
    kit.text("PROYEK", left + 24, top + 40, label(18, C.text));
    title(kit, TITLE, left + 24, top + 94, right - markCell - left - 48, { size: 48, color: C.ink });
    specRow(
      kit,
      [
        ["DIGAMBAR", "CIA PHOTOBOOTH"],
        ["TANGGAL", stamp.numericDate],
        ["JAM", stamp.time],
        ["LEMBAR", stamp.session],
      ],
      {
        x: left + 24,
        y: top + 150,
        width: right - markCell - left - 32,
        labelStyle: label(16, C.text),
        value: display(34, C.ink, { min: 16 }),
        divider: C.line,
      },
    );
  },
};

const pass = {
  id: "cia-pass",
  name: "Site Pass",
  note: "Kartu akses area proyek: pita pembatas, data pemegang, dan barcode.",
  layout: "auto",
  spacing: () => ({ top: 560, side: 110, gap: 20, bottom: 470 }),
  draw(kit, images, layout) {
    const { W, H, stamp } = kit;
    kit.fill(C.red);
    kit.roundRect(44, 44, W - 88, H - 88, 32, C.paper);
    kit.roundRect(W / 2 - 90, 76, 180, 30, 15, C.red);
    kit.fill(C.ink, 44, 138, W - 88, 332);

    kit.logo({ x: 104, y: 174, w: 132, ink: C.inkOnDark });
    kit.text("SITE ACCESS PASS", 272, 214, label(28, C.red, { weight: 700 }));
    title(kit, TITLE, 270, 330, W - 44 - 56 - 270, { size: 130, color: C.white });
    kit.text("AREA PROYEK · TEKNIK SIPIL", 272, 386, label(24, C.muted));
    kit.hazard(44, 470, W - 88, 40, C.red, C.ink, 32);

    drawPhotos(kit, images, layout, { radius: 10 });

    const cut = layout.bodyBottom + 50;
    kit.line(110, cut, W - 110, cut, C.line, 2, [12, 10]);
    specRow(
      kit,
      [
        ["PEMEGANG", "PENGUNJUNG"],
        ["AKSES", "ALL SITE"],
        ["TANGGAL", stamp.shortDate],
        ["NO.", stamp.session],
      ],
      {
        x: 110,
        y: cut + 70,
        width: W - 220,
        labelStyle: label(18, C.text),
        value: display(44, C.ink, { min: 20 }),
        divider: C.line,
      },
    );
    kit.barcode(110, cut + 160, 560, 100, C.ink);
    kit.text("SAFETY FIRST", W - 110, cut + 212, display(46, C.red, { align: "right" }));
    kit.text("WAJIB APD · K3", W - 110, cut + 254, label(22, C.text, { align: "right" }));
    kit.watermark({ x: W / 2, y: H - 82, align: "center", color: C.text });
  },
};

const construction = {
  id: "cia-construction",
  name: "Proyek Berjalan",
  note: "Pita pembatas proyek dan huruf stensil ala papan konstruksi.",
  layout: "feature",
  spacing: () => ({ top: 470, side: 80, gap: 22, bottom: 320 }),
  draw(kit, images, layout) {
    const { W, H, stamp } = kit;
    kit.fill(C.ink);
    kit.grid("rgba(255, 255, 255, 0.03)", 40);

    tape(kit, { y: 98, angle: -3, text: "AREA KONSTRUKSI · DILARANG MASUK KECUALI BERGAYA" });
    const size = kit.fit(TITLE, W - 140, display(180));
    kit.stencil(TITLE, W / 2, 330, display(size, C.white, { align: "center", cut: C.ink }));
    kit.text("SEDANG DIBANGUN: KENANGAN", W / 2, 404, label(26, C.red, { align: "center", weight: 700 }));

    drawPhotos(kit, images, layout, { border: 8, borderColor: C.white });

    tape(kit, {
      y: layout.bodyBottom + 130,
      angle: 2,
      hazard: true,
      text: `PROYEK N° ${stamp.session} · ${stamp.shortDate.toUpperCase()}`,
    });
    kit.watermark({ x: W / 2, y: H - 54, align: "center", color: C.muted, markInk: C.inkOnDark });
  },
};

const steel = {
  id: "cia-steel",
  name: "Struktur Baja",
  note: "Balok profil WF, baut, dan pelat baja di tiap foto.",
  layout: "grid",
  spacing: () => ({ top: 440, side: 96, gap: 36, bottom: 330 }),
  draw(kit, images, layout) {
    const { W, H, stamp } = kit;
    kit.fill("#17181B");
    kit.grid("rgba(255, 255, 255, 0.035)", 60);

    beam(kit, { y: 64, h: 260 });
    title(kit, TITLE, W / 2, 252, W - 280, { size: 150, color: C.white, align: "center" });
    kit.text("PROFIL WF 400 × 200 × 8 × 13", W / 2, 292, label(20, C.steelLight, { align: "center" }));
    kit.text("PHOTOBOOTH TEKNIK SIPIL", 96, 390, label(24, C.red, { weight: 700 }));
    kit.text(
      `ELEMEN ${pad2(images.length)} · ${stamp.numericDate}`,
      W - 96,
      390,
      label(22, C.steelLight, { align: "right" }),
    );

    drawPhotos(kit, images, layout, {
      border: 14,
      borderColor: C.steel,
      after: (slot, index) => {
        [
          [slot.x - 7, slot.y - 7],
          [slot.x + slot.w + 7, slot.y - 7],
          [slot.x - 7, slot.y + slot.h + 7],
          [slot.x + slot.w + 7, slot.y + slot.h + 7],
        ].forEach(([x, y]) => bolt(kit, x, y, 6));
        kit.fill(C.red, slot.x + slot.w - 78, slot.y + slot.h - 36, 78, 36);
        kit.text(
          `B-${index + 1}`,
          slot.x + slot.w - 39,
          slot.y + slot.h - 10,
          label(22, C.white, { weight: 700, align: "center", spacing: 1 }),
        );
      },
    });

    const y = layout.bodyBottom;
    beam(kit, { y: y + 70, h: 120, plates: false });
    kit.text("MUTU BJ 41 · fy 250 MPa · SAMBUNGAN BAUT", W / 2, y + 138, label(22, C.white, { align: "center" }));
    kit.watermark({ x: W / 2, y: H - 58, align: "center", color: C.steelLight, markInk: C.inkOnDark });
  },
};

const bridge = {
  id: "cia-bridge",
  name: "Jembatan",
  note: "Rangka jembatan baja di atas, garis bentang di bawah.",
  layout: "auto",
  spacing: () => ({ top: 470, side: 90, gap: 24, bottom: 330 }),
  draw(kit, images, layout) {
    const { W, H, stamp } = kit;
    kit.fill(C.paper);
    title(kit, TITLE, W / 2, 168, W - 180, { size: 150, color: C.ink, align: "center" });
    truss(kit, { left: 90, right: W - 90, top: 222, deck: 362, panels: 8 });
    kit.text("JEMBATAN RANGKA BAJA · BENTANG KENANGAN", W / 2, 444, label(22, C.text, { align: "center" }));

    drawPhotos(kit, images, layout, {
      after: (slot) => kit.strokeRect(slot.x, slot.y, slot.w, slot.h, C.ink, 3),
    });

    const box = photoBounds(layout);
    const y = layout.bodyBottom;
    kit.dimension(box.left, y + 60, box.right, `BENTANG ${pad2(images.length)} FOTO`, {
      color: C.ink,
      bg: C.paper,
    });
    waves(kit, y + 140, C.steelLight);
    kit.text(stamp.longDate.toUpperCase(), 90, H - 62, label(22, C.text));
    kit.watermark({ x: W - 90, y: H - 62, align: "right", color: C.text });
  },
};

const survey = {
  id: "cia-survey",
  name: "Survey",
  note: "Peta kontur, arah utara, dan koordinat di tiap foto.",
  layout: "grid",
  spacing: () => ({ top: 430, side: 100, gap: 54, bottom: 330 }),
  draw(kit, images, layout) {
    const { W, H, stamp, random } = kit;
    kit.fill(C.white);
    contours(kit, { cx: W - 150, cy: 150, base: 50, rings: 13, color: "rgba(240, 12, 28, 0.16)" });
    contours(kit, { cx: 120, cy: H - 170, base: 40, rings: 12, color: "rgba(17, 17, 19, 0.1)" });

    kit.logo({ x: 100, y: 92, w: 84 });
    title(kit, TITLE, 204, 176, W - 204 - 240, { size: 120, color: C.ink });
    kit.text("SURVEY & PEMETAAN · TITIK FOTO", 206, 222, label(22, C.red, { weight: 700 }));
    northArrow(kit, W - 130, 146);
    kit.polygon([[100, 330], [124, 290], [148, 330]], C.red);
    kit.text(`BM-${stamp.session} · TITIK IKAT`, 162, 326, label(22, C.ink, { weight: 700 }));

    const lat = 7 + random() * 0.9;
    const lon = 110 + random() * 0.9;
    drawPhotos(kit, images, layout, {
      after: (slot, index) => {
        reticle(kit, slot);
        kit.text(
          `P${index + 1}  ${dms("S", lat + index * 0.0021)}  ${dms("E", lon + index * 0.0017)}`,
          slot.x,
          slot.y + slot.h + 32,
          label(18, C.text, { spacing: 1 }),
        );
      },
    });

    const y = layout.bodyBottom + 90;
    for (let i = 0; i < 4; i++) kit.fill(i % 2 ? C.white : C.ink, 100 + i * 80, y, 80, 16);
    kit.strokeRect(100, y, 320, 16, C.ink, 2);
    ["0", "5", "10", "15", "20 M"].forEach((text, i) =>
      kit.text(text, 100 + i * 80, y + 48, label(18, C.ink, { align: i ? "center" : "left", spacing: 1 })),
    );
    kit.text(stamp.longDate.toUpperCase(), W - 100, y + 14, label(20, C.text, { align: "right" }));
    kit.watermark({ x: 100, y: H - 64, color: C.text });
  },
};

const concrete = {
  id: "cia-concrete",
  name: "Beton Ekspos",
  note: "Dinding beton dengan lubang tie, foto seperti sampel hasil QC.",
  layout: "polaroid",
  spacing: () => ({ top: 420, side: 90, gap: 44, bottom: 280, pad: 22, caption: 84 }),
  draw(kit, images, layout) {
    const { W, H, stamp } = kit;
    kit.fill(C.concrete);
    for (let x = 300; x < W; x += 300) kit.line(x, 0, x, H, "rgba(0, 0, 0, 0.12)", 2);
    for (let y = 600; y < H; y += 600) kit.line(0, y, W, y, "rgba(0, 0, 0, 0.12)", 2);
    // Lubang tie bekisting; baris judul dikosongkan supaya tidak terbaca sebagai titik di teks.
    for (let y = 450; y < layout.bodyBottom; y += 300) {
      for (let x = 150; x < W; x += 300) {
        kit.circle(x, y, 13, "#7E7B75");
        kit.circle(x, y, 8, "#55534F");
      }
    }
    kit.grain(0.09);

    const size = kit.fit(TITLE, W - 160, display(170));
    kit.stencil(TITLE, W / 2, 250, display(size, C.ink, { align: "center", cut: C.concrete }));
    kit.text(
      "BETON EKSPOS · f'c 30 MPa · CURING 28 HARI",
      W / 2,
      320,
      label(24, C.ink, { align: "center", weight: 700 }),
    );

    const captions = ["f'c 30 MPa", "SLUMP 10 ± 2", "D16 - 150", "CURING 28 HARI", "COR TERUS!", "KUAT TEKAN"];
    drawPhotos(kit, images, layout, {
      frameColor: C.paper,
      shadow: { color: "rgba(0, 0, 0, 0.32)", blur: 18, y: 8 },
      after: (slot, index) =>
        kit.within(slot, () => {
          const frame = slot.frame;
          kit.text(
            captions[index % captions.length],
            frame.x + frame.w / 2,
            frame.y + frame.h - 30,
            display(Math.min(34, frame.w / 10), C.ink, { align: "center", weight: 700 }),
          );
        }),
    });

    const y = layout.bodyBottom;
    kit.text(stamp.longDate.toUpperCase(), 90, y + 110, label(22, C.ink, { weight: 700 }));
    qcStamp(kit, W - 210, y + 116);
    kit.watermark({ x: 90, y: H - 60, color: C.ink });
  },
};

const strip = {
  id: "cia-strip",
  name: "Photostrip",
  note: "Dua photostrip 2 × 6 inci dalam satu lembar 4R, tinggal digunting.",
  layout: "strip",
  spacing: () => ({ top: 262, side: 46, gap: 16, bottom: 214 }),
  draw(kit, images, layout) {
    const { W, H, stamp } = kit;
    const half = W / 2;
    kit.fill(C.white);

    [0, half].forEach((left) => {
      const cx = left + half / 2;
      kit.logo({ x: cx, y: 40, w: 96, align: "center" });
      title(kit, TITLE, cx, 222, half - 92, { size: 72, color: C.ink, align: "center" });
      const y = layout.bodyBottom;
      kit.hazard(left + 46, y + 28, half - 92, 12, C.red, C.white, 14);
      kit.text(stamp.longDate.toUpperCase(), cx, y + 88, label(18, C.text, { align: "center", spacing: 1 }));
      kit.text("CIA PHOTOBOOTH · TEKNIK SIPIL", cx, H - 52, label(17, C.muted, { align: "center" }));
    });

    drawPhotos(kit, images, layout);
    kit.line(half, 20, half, H - 20, C.line, 2, [10, 10]);

    // Sesi 1–2 foto: sisa strip diisi logo besar, bukan ruang kosong.
    const { free } = layout;
    if (free.h < 260) return;
    [0, half].forEach((left) => {
      const cx = left + half / 2;
      const width = Math.min(half - 180, ((free.h - 120) * 388) / 455);
      const height = (width * 455) / 388;
      const top = free.y + (free.h - height - 70) / 2;
      kit.logo({ x: cx, y: top, w: width, align: "center" });
      kit.text(`STRIP N° ${stamp.session}`, cx, top + height + 58, label(20, C.text, { align: "center", spacing: 4 }));
    });
  },
};

const cover = {
  id: "cia-cover",
  name: "Sampul",
  note: "Sampul majalah teknik sipil, foto utama penuh.",
  layout: "magazine",
  spacing: () => ({ side: 70, gap: 22, bottom: 300, insetTop: 26 }),
  draw(kit, images, layout) {
    const { W, stamp, ctx } = kit;
    kit.fill(C.white);
    drawPhotos(kit, images, layout);

    const coverSlot = layout.slots[0];
    const scrim = ctx.createLinearGradient(0, 0, 0, 380);
    scrim.addColorStop(0, "rgba(0, 0, 0, 0.72)");
    scrim.addColorStop(1, "rgba(0, 0, 0, 0)");
    kit.fill(scrim, 0, 0, W, 380);

    title(kit, TITLE, W / 2, 196, W - 100, { size: 220, color: C.white, align: "center" });
    kit.fill(C.red, 50, 222, W - 100, 8);
    kit.text(
      `EDISI TEKNIK SIPIL · N° ${stamp.session} · ${stamp.shortDate.toUpperCase()}`,
      W / 2,
      270,
      label(22, C.white, { align: "center", weight: 700 }),
    );

    const base = coverSlot.h - 70;
    kit.fill(C.red, 50, base - 150, 540, 150);
    kit.text("STRUKTUR KUAT,", 74, base - 86, display(56, C.white));
    kit.text("POSE HEBAT.", 74, base - 26, display(56, C.white));

    const y = layout.bodyBottom;
    kit.line(70, y + 50, W - 70, y + 50, C.ink, 3);
    kit.logo({ x: 70, y: y + 84, w: 70 });
    kit.text("CIA PHOTOBOOTH", 162, y + 124, display(40, C.ink));
    kit.text("CIVIL IN ACTION · TEKNIK SIPIL", 164, y + 158, label(20, C.text));
    kit.barcode(W - 330, y + 88, 260, 72, C.ink);
    kit.text(`GRATIS · ${stamp.time}`, W - 70, y + 196, label(18, C.text, { align: "right" }));
  },
};

const civilDesigns = [
  poster,
  drawing,
  pass,
  construction,
  steel,
  bridge,
  survey,
  concrete,
  strip,
  cover,
];

export default civilDesigns;
