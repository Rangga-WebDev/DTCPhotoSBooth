/**
 * DESAIN PHOTOCARD HMS-FT UNISMUH MAKASSAR (Himpunan Mahasiswa Sipil)
 *   Warna & motif diambil dari logo HMS: cincin biru, lingkaran merah, saluran hitam, dinding bata.
 *   Logo resmi digambar dari raster (kit.art("hms")); kalau gagal dimuat, dipakai lencana cadangan.
 *
 * @format
 */

import { HMS } from "../../../data/brand";
import { C, bigTitle, display, drawPhotos, label, pad2, photoBounds, title } from "./common";

const P = {
  ...HMS.colors,
  white: "#FFFFFF",
  paper: "#F5F9FB",
  water: "#C9EAF7",
  wave: "#4FB6DD",
  earth: "#A9B3B8",
  text: "#4D5A61",
};

/* ---------- ornamen ---------- */

// Logo HMS bulat. ring = tepi putih supaya cincin biru logo lepas dari latar biru.
function badge(kit, { cx, cy, size, ring = 0, ringColor = P.white }) {
  const r = size / 2;
  if (ring) kit.circle(cx, cy, r + ring, ringColor);
  const logo = kit.art("hms");
  if (logo) {
    kit.image(logo, cx - r, cy - r, size, size);
    return;
  }
  kit.circle(cx, cy, r, P.blue);
  kit.circle(cx, cy, r * 0.7, P.red);
  kit.text("HMS", cx, cy + r * 0.2, display(Math.round(r * 0.6), P.white, { align: "center" }));
}

// Dinding bata seperti di logo: bata putih, nat merah, susun setengah bata.
function bricks(kit, { x, y, w, h, rows, brick = P.white, mortar = P.red }) {
  const { ctx } = kit;
  const rowH = h / rows;
  const joint = Math.max(3, Math.round(rowH * 0.16));
  const length = rowH * 2.9;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  kit.fill(mortar, x, y, w, h);
  for (let row = 0; row < rows; row++) {
    const top = y + row * rowH + joint / 2;
    const start = x - (row % 2 ? length / 2 : length * 0.15);
    for (let left = start; left < x + w; left += length) {
      kit.fill(brick, left + joint / 2, top, length - joint, rowH - joint);
      kit.strokeRect(left + joint / 2, top, length - joint, rowH - joint, "rgba(31, 26, 23, 0.4)", 1.5);
    }
  }
  ctx.restore();
}

// Tanda patok di cincin logo: kotak 2 × 2 ditembus garis silang.
function marker(kit, cx, cy, s, color) {
  const t = Math.max(2, s * 0.16);
  kit.line(cx, cy - s, cx, cy + s, color, t);
  kit.line(cx - s * 0.9, cy, cx + s * 0.9, cy, color, t);
  kit.strokeRect(cx - s * 0.34, cy - s * 0.5, s * 0.68, s, color, t);
}

// Potongan melintang saluran trapesium (bentuk saluran hitam di logo) berisi air.
function canal(kit, { x, ground, bottomW, depth, arm = 80, fill = 0.7 }) {
  const { ctx } = kit;
  const topW = bottomW + depth * 2;
  const floor = ground + depth;
  const profile = [
    [x - arm, ground],
    [x, ground],
    [x + depth, floor],
    [x + depth + bottomW, floor],
    [x + topW, ground],
    [x + topW + arm, ground],
  ];

  // Tanah: arsir miring selebar 28 px di bawah profil.
  ctx.save();
  ctx.beginPath();
  profile.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
  [...profile].reverse().forEach(([px, py]) => ctx.lineTo(px, py + 28));
  ctx.closePath();
  ctx.clip();
  for (let k = -depth - 60; k < topW + arm * 2 + 60; k += 13) {
    const x0 = x - arm + k;
    kit.line(x0, floor + 40, x0 + depth + 60, ground - 20, P.earth, 2);
  }
  ctx.restore();

  // Air sampai muka air normal, dengan riak.
  const level = ground + depth * (1 - fill);
  const inset = level - ground;
  const water = [
    [x + inset, level],
    [x + topW - inset, level],
    [x + depth + bottomW, floor],
    [x + depth, floor],
  ];
  kit.polygon(water, P.water);
  ctx.save();
  kit.polygon(water);
  ctx.clip();
  ctx.strokeStyle = P.wave;
  ctx.lineWidth = 2.5;
  [0.32, 0.64].forEach((share) => {
    const wy = level + (floor - level) * share;
    ctx.beginPath();
    for (let wx = x; wx <= x + topW; wx += 6) {
      const value = wy + Math.sin((wx - x) / 16) * 3.5;
      if (wx === x) ctx.moveTo(wx, value);
      else ctx.lineTo(wx, value);
    }
    ctx.stroke();
  });
  ctx.restore();

  // Lapisan saluran: garis hitam tebal seperti di logo.
  ctx.save();
  ctx.strokeStyle = P.black;
  ctx.lineWidth = 12;
  ctx.lineJoin = "miter";
  ctx.beginPath();
  profile.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
  ctx.stroke();
  ctx.restore();

  // Simbol muka air ▽ + garis kecil di bawahnya.
  const sx = x + topW / 2 + 40;
  kit.polygon([[sx - 15, level - 25], [sx + 15, level - 25], [sx, level - 1]], P.white, P.blue, 2.5);
  kit.line(sx - 12, level + 9, sx + 12, level + 9, P.blue, 2.5);
  kit.line(sx - 6, level + 17, sx + 6, level + 17, P.blue, 2.5);
  kit.text("M.A.N", sx + 26, level - 6, label(17, P.blue, { weight: 700, spacing: 1 }));

  kit.text("1 : 1", x + topW - depth / 2 + 40, ground + depth / 2 + 12, label(18, P.text, { spacing: 1 }));
  kit.dimension(x + depth, floor + 50, x + depth + bottomW, "b = 1,50 m", {
    color: P.black,
    bg: P.paper,
    size: 18,
  });
}

/* ---------- desain ---------- */

const lencana = {
  id: "hms-badge",
  name: "HMS Lencana",
  note: "Biru-merah logo HMS-FT Unismuh Makassar: lencana besar dan dinding bata.",
  layout: "auto",
  spacing: () => ({ top: 530, side: 80, gap: 36, bottom: 340 }),
  draw(kit, images, layout) {
    const { W, H, stamp } = kit;
    const cx = 252;
    const cy = 268;
    kit.fill(P.blue);
    // Gelang cincin logo yang melebar ke seluruh kartu.
    for (let r = 236; r < 2000; r += 64) kit.circle(cx, cy, r, null, "rgba(255, 255, 255, 0.07)", 2);
    badge(kit, { cx, cy, size: 340, ring: 12 });

    const left = 486;
    const width = W - 80 - left;
    kit.text(HMS.long, left, 134, label(26, P.white, { weight: 700 }));
    const size = kit.fit(HMS.short, width, display(230));
    const baseline = 166 + size * 0.7;
    kit.text(HMS.short, left - size * 0.02, baseline, display(size, P.white));

    const ribbon = baseline + 30;
    kit.fill(P.red, left, ribbon, width, 76);
    const campus = kit.fit(HMS.campus, width - 56, display(58));
    kit.text(
      HMS.campus,
      left + width / 2,
      ribbon + 38 + campus * 0.35,
      display(campus, P.white, { align: "center" }),
    );
    kit.text("FAKULTAS TEKNIK", left, ribbon + 124, label(24, P.white, { weight: 700 }));
    kit.text(`N° ${stamp.session}`, W - 80, ribbon + 124, label(24, P.white, { weight: 700, align: "right" }));

    drawPhotos(kit, images, layout, {
      border: 10,
      borderColor: P.white,
      after: (slot, index) => {
        kit.fill(P.red, slot.x, slot.y, 60, 38);
        kit.text(
          pad2(index + 1),
          slot.x + 30,
          slot.y + 28,
          label(24, P.white, { weight: 700, align: "center", spacing: 0 }),
        );
      },
    });

    const y = layout.bodyBottom;
    marker(kit, 96, y + 76, 22, P.black);
    marker(kit, W - 96, y + 76, 22, P.black);
    kit.text(stamp.longDate.toUpperCase(), 140, y + 85, label(24, P.white, { weight: 700 }));
    kit.text(stamp.time, W - 140, y + 85, label(24, P.white, { weight: 700, align: "right" }));
    bricks(kit, { x: 0, y: H - 196, w: W, h: 196, rows: 4 });
    kit.watermark({ x: W / 2, y: H - 88, align: "center", color: P.white, markInk: C.inkOnDark, plate: P.black });
  },
};

const pengairan = {
  id: "hms-irrigation",
  name: "HMS Pengairan",
  note: "Gambar potongan saluran irigasi: muka air, garis ukur, dan logo HMS-FT.",
  layout: "grid",
  spacing: () => ({ top: 490, side: 110, gap: 50, bottom: 470 }),
  draw(kit, images, layout) {
    const { W, H, stamp } = kit;
    kit.fill(P.paper);
    kit.grid("rgba(0, 153, 203, 0.08)", 30, 1, [56, 56, W - 112, H - 112]);
    kit.strokeRect(30, 30, W - 60, H - 60, P.blue, 4);
    kit.strokeRect(56, 56, W - 112, H - 112, P.blue, 1.5);

    badge(kit, { cx: 206, cy: 202, size: 212 });
    bigTitle(kit, {
      x: 350,
      top: 112,
      width: W - 100 - 350,
      lines: ["HMS-FT UNISMUH", "MAKASSAR"],
      colors: [P.black, P.blue],
      size: 130,
      gap: 16,
    });
    kit.text("TEKNIK PENGAIRAN · FAKULTAS TEKNIK", 100, 372, label(22, P.red, { weight: 700 }));
    kit.text(`LEMBAR HMS-${stamp.session}`, W - 100, 372, label(20, P.text, { align: "right" }));
    kit.line(100, 394, W - 100, 394, P.black, 3);
    kit.line(100, 402, W - 100, 402, P.black, 1);

    const box = photoBounds(layout);
    kit.dimension(box.left, box.top - 42, box.right, "TRASE SALURAN", {
      color: P.blue,
      bg: P.paper,
      size: 18,
    });

    drawPhotos(kit, images, layout, {
      border: 3,
      borderColor: P.black,
      after: (slot, index) => {
        const station = `STA 0+${String(index * 50).padStart(3, "0")}`;
        const options = label(18, P.white, { weight: 700, spacing: 1 });
        kit.fill(P.blue, slot.x, slot.y, kit.measure(station, options) + 24, 34);
        kit.text(station, slot.x + 12, slot.y + 24, options);
      },
    });

    const y = layout.bodyBottom;
    kit.text("POTONGAN MELINTANG SALURAN · SKALA 1 : 50", 100, y + 66, label(20, P.blue, { weight: 700 }));
    canal(kit, { x: 190, ground: y + 132, bottomW: 240, depth: 128 });

    const bx = 800;
    const by = y + 92;
    const bw = W - 100 - bx;
    kit.fill(P.white, bx, by, bw, 238);
    kit.fill(P.blue, bx, by, bw, 42);
    kit.strokeRect(bx, by, bw, 238, P.blue, 2);
    kit.text("DATA HIDROLIS", bx + 20, by + 29, label(18, P.white, { weight: 700 }));
    title(kit, "Q = A × V", bx + 20, by + 108, bw - 40, { size: 58, color: P.black });
    kit.text("DEBIT KENANGAN", bx + 20, by + 144, label(20, P.red, { weight: 700 }));
    kit.line(bx + 20, by + 164, bx + bw - 20, by + 164, P.blue, 1.5);
    kit.text(stamp.shortDate.toUpperCase(), bx + 20, by + 198, label(19, P.text));
    kit.text(`${stamp.time} · N° ${stamp.session}`, bx + 20, by + 226, label(19, P.text));

    kit.watermark({ x: 100, y: H - 84, color: P.text });
    kit.text(HMS.name, W - 100, H - 84, label(20, P.text, { align: "right" }));
  },
};

const strip = {
  id: "hms-strip",
  name: "HMS Strip",
  note: "Dua photostrip HMS-FT 2 × 6 inci dalam satu lembar 4R, tinggal digunting.",
  layout: "strip",
  spacing: () => ({ top: 322, side: 44, gap: 14, bottom: 226 }),
  draw(kit, images, layout) {
    const { W, H, stamp } = kit;
    const half = W / 2;
    kit.fill(P.white);

    [0, half].forEach((left) => {
      const cx = left + half / 2;
      kit.fill(P.blue, left, 0, half, 302);
      badge(kit, { cx, cy: 92, size: 136, ring: 6 });
      title(kit, HMS.short, cx, 244, half - 120, { size: 92, color: P.white, align: "center" });
      kit.text(HMS.campus, cx, 282, label(22, P.white, { weight: 700, align: "center" }));

      const y = layout.bodyBottom;
      kit.fill(P.blue, left, y + 24, half, H - y - 24);
      kit.text(stamp.longDate.toUpperCase(), cx, y + 82, label(18, P.white, { weight: 700, align: "center", spacing: 1 }));
      kit.text(`${HMS.long} · CIVIL IN ACTION`, cx, y + 114, label(15, P.white, { align: "center" }));
      bricks(kit, { x: left, y: H - 72, w: half, h: 72, rows: 2 });
    });

    drawPhotos(kit, images, layout);
    kit.line(half, 20, half, H - 20, C.line, 2, [10, 10]);

    // Sesi 1–2 foto: sisa strip diisi logo HMS besar.
    const { free } = layout;
    if (free.h < 260) return;
    [0, half].forEach((left) => {
      const cx = left + half / 2;
      const size = Math.min(half - 160, free.h - 130);
      const top = free.y + (free.h - size - 70) / 2;
      badge(kit, { cx, cy: top + size / 2, size });
      kit.text(`STRIP N° ${stamp.session}`, cx, top + size + 58, label(20, P.text, { align: "center", spacing: 4 }));
    });
  },
};

const hmsDesigns = [lencana, pengairan, strip];

export default hmsDesigns;
