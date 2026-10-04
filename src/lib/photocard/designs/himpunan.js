/** @format */

import { C, drawPhotos, mono, pad2, title } from "./common";

// Kop himpunan: akronim besar + nama jurusan. Logo resmi himpunan bisa ditambahkan nanti.
function badge(kit, { acronym, field, x, y, color, fieldColor, size = 170 }) {
  kit.text(acronym, x, y, { size, weight: 900, stretch: "condensed", color });
  kit.text(
    field,
    x + 4,
    y + 50,
    mono(22, fieldColor, { weight: 600, spacing: 5 }),
  );
}

const hms = {
  id: "hm-hms",
  name: "HMS",
  category: "himpunan",
  note: "Teknik Sipil: gambar struktur, profil baja, rangka batang.",
  layout: "grid",
  spacing: () => ({ top: 390, side: 90, gap: 32, bottom: 320 }),
  draw(kit, images, layout) {
    const { W, H, stamp, ctx } = kit;
    kit.fill("#E6EAEE");
    kit.grid("rgba(5, 75, 174, 0.08)", 30);

    badge(kit, {
      acronym: "HMS",
      field: "TEKNIK SIPIL",
      x: 90,
      y: 220,
      color: C.ink,
      fieldColor: C.deep,
    });

    const ix = W - 260;
    const iy = 70;
    ctx.save();
    ctx.fillStyle = C.deep;
    ctx.beginPath();
    ctx.rect(ix, iy, 170, 26);
    ctx.rect(ix + 72, iy + 26, 26, 150);
    ctx.rect(ix, iy + 176, 170, 26);
    ctx.fill();
    ctx.restore();
    kit.line(ix - 30, iy, ix - 30, iy + 202, C.ink, 1.5);
    kit.text("WF 400", ix - 44, iy + 110, mono(16, C.ink, { align: "right" }));

    const ty = layout.slots[0].y - 46;
    kit.line(90, ty, W - 90, ty, C.ink, 2);
    for (let x = 90; x < W - 90; x += 102) {
      kit.line(x, ty, x + 51, ty - 34, C.ink, 1.5);
      kit.line(x + 51, ty - 34, x + 102, ty, C.ink, 1.5);
      kit.line(x + 51, ty - 34, Math.min(x + 153, W - 90), ty - 34, C.ink, 1.5);
    }

    drawPhotos(kit, images, layout, {
      border: 6,
      borderColor: C.ink,
      after: (slot, index) =>
        kit.text(
          `BAY ${String.fromCharCode(65 + index)}`,
          slot.x + 16,
          slot.y + 34,
          mono(18, C.white, { weight: 600 }),
        ),
    });

    const y = layout.bodyBottom + 80;
    kit.line(90, y, W - 90, y, C.ink, 1.5);
    [90, W - 90].forEach((x) => kit.line(x, y - 14, x, y + 14, C.ink, 1.5));
    kit.fill("#E6EAEE", W / 2 - 170, y - 16, 340, 32);
    kit.text(
      `BENTANG ${pad2(images.length)} FOTO · SKALA 1:1`,
      W / 2,
      y + 7,
      mono(18, C.ink, { align: "center" }),
    );
    kit.text(`${stamp.numericDate} · DTC 2026`, 90, y + 90, mono(20, C.text));
    kit.watermark({ x: 90, y: H - 60 });
  },
};

const hme = {
  id: "hm-hme",
  name: "HME",
  category: "himpunan",
  note: "Teknik Elektro: layar osiloskop dan gelombang sinyal.",
  layout: "auto",
  spacing: () => ({ top: 400, side: 90, gap: 28, bottom: 300 }),
  draw(kit, images, layout) {
    const { W, H, stamp, ctx } = kit;
    kit.fill("#06101E");
    kit.grid("rgba(18, 200, 244, 0.08)", 50);

    badge(kit, {
      acronym: "HME",
      field: "TEKNIK ELEKTRO",
      x: 90,
      y: 200,
      color: C.white,
      fieldColor: C.cyan,
    });

    const wave = (y, amplitude, period, color, lineWidth) => {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      for (let x = 0; x <= W; x += 6) {
        const value = y + Math.sin((x / period) * Math.PI * 2) * amplitude;
        if (x === 0) ctx.moveTo(x, value);
        else ctx.lineTo(x, value);
      }
      ctx.stroke();
      ctx.restore();
    };
    wave(330, 34, 260, C.cyan, 4);
    wave(330, 18, 130, "rgba(0, 158, 247, 0.5)", 2);
    kit.text(
      "CH1 2.00V · 50Hz",
      W - 90,
      120,
      mono(20, C.cyan, { align: "right" }),
    );
    kit.text(
      `T = ${stamp.time}`,
      W - 90,
      156,
      mono(20, C.muted, { align: "right" }),
    );

    drawPhotos(kit, images, layout, {
      after: (slot, index) => {
        kit.strokeRect(slot.x, slot.y, slot.w, slot.h, C.cyan, 3);
        kit.text(
          `V${index + 1}`,
          slot.x + 18,
          slot.y + 38,
          mono(22, C.cyan, { weight: 600 }),
        );
      },
    });

    const y = layout.bodyBottom + 80;
    [C.ink, C.blue, C.cyan, C.white].forEach((color, index) =>
      kit.fill(color, 90 + index * 34, y - 30, 22, 60),
    );
    kit.line(60, y, 90, y, C.muted, 3);
    kit.line(90 + 4 * 34 - 12, y, 300, y, C.muted, 3);
    kit.text(
      `SIGNAL ${stamp.session} · DTC 2026`,
      330,
      y + 8,
      mono(22, C.white, { weight: 600 }),
    );
    kit.watermark({ x: 90, y: H - 60, color: C.white, logoColor: C.white });
  },
};

const hma = {
  id: "hm-hma",
  name: "HMA",
  category: "himpunan",
  note: "Arsitektur: potongan bangunan di kertas kalkir.",
  layout: "feature",
  spacing: () => ({ top: 420, side: 90, gap: 26, bottom: 320 }),
  draw(kit, images, layout) {
    const { W, H, stamp, ctx } = kit;
    kit.fill("#F2F0EA");
    kit.grid("rgba(5, 10, 18, 0.05)", 24);

    badge(kit, {
      acronym: "HMA",
      field: "ARSITEKTUR",
      x: 90,
      y: 200,
      color: C.ink,
      fieldColor: C.blue,
    });

    const gx = W - 420;
    const gy = 330;
    ctx.save();
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.lineTo(gx, gy - 150);
    ctx.lineTo(gx + 160, gy - 250);
    ctx.lineTo(gx + 320, gy - 150);
    ctx.lineTo(gx + 320, gy);
    ctx.moveTo(gx + 40, gy);
    ctx.lineTo(gx + 40, gy - 90);
    ctx.lineTo(gx + 110, gy - 90);
    ctx.lineTo(gx + 110, gy);
    ctx.stroke();
    ctx.restore();
    kit.line(gx - 40, gy, gx + 360, gy, C.ink, 4);
    kit.strokeRect(gx + 170, gy - 120, 110, 70, C.blue, 2.5);
    kit.line(gx + 160, gy - 250, gx + 160, gy - 290, C.blue, 1.5, [6, 6]);
    kit.text(
      "POTONGAN A–A",
      gx + 160,
      gy + 36,
      mono(16, C.ink, { align: "center" }),
    );

    drawPhotos(kit, images, layout, { border: 3, borderColor: C.ink });

    const y = layout.bodyBottom + 80;
    kit.strokeRect(90, y, W - 180, 150, C.ink, 2);
    kit.line(W - 420, y, W - 420, y + 150, C.ink, 1.5);
    kit.text("STUDIO · DTCBOOTH", 116, y + 58, mono(18, C.text));
    kit.text("RUANG KENANGAN", 114, y + 118, {
      size: 56,
      weight: 800,
      stretch: "condensed",
      color: C.ink,
    });
    kit.text(
      stamp.numericDate,
      W - 116,
      y + 58,
      mono(18, C.text, { align: "right" }),
    );
    kit.text(`LBR ${stamp.session}`, W - 116, y + 118, {
      size: 56,
      weight: 800,
      stretch: "condensed",
      color: C.blue,
      align: "right",
    });
    kit.watermark({ x: 90, y: H - 60, color: C.text });
  },
};

const hmif = {
  id: "hm-hmif",
  name: "HMIF",
  category: "himpunan",
  note: "Informatika: jendela terminal dan perintah capture.",
  layout: "auto",
  spacing: () => ({ top: 420, side: 110, gap: 90, bottom: 300 }),
  draw(kit, images, layout) {
    const { W, H, stamp, random } = kit;
    kit.fill("#0B1220");
    for (let i = 0; i < 70; i++) {
      kit.text(
        random() < 0.5 ? "0" : "1",
        random() * W,
        random() * H,
        mono(20, "rgba(18, 200, 244, 0.12)", { spacing: 0 }),
      );
    }

    badge(kit, {
      acronym: "HMIF",
      field: "INFORMATIKA",
      x: 110,
      y: 200,
      color: C.white,
      fieldColor: C.cyan,
    });
    kit.text(
      `$ dtcbooth --capture --photos ${images.length}`,
      114,
      330,
      mono(24, C.cyan, { weight: 600, spacing: 0 }),
    );
    kit.text(
      `> ok · session ${stamp.session} · ${stamp.time}`,
      114,
      370,
      mono(22, C.muted, { spacing: 0 }),
    );

    drawPhotos(kit, images, layout, {
      after: (slot, index) => {
        const bar = 44;
        kit.roundRect(
          slot.x - 2,
          slot.y - bar,
          slot.w + 4,
          bar + 4,
          10,
          "#1A2638",
        );
        [C.signal, "#F5B83D", "#3DD68C"].forEach((color, dot) =>
          kit.circle(slot.x + 26 + dot * 26, slot.y - bar / 2, 8, color),
        );
        kit.text(
          `photo_${pad2(index + 1)}.jpg`,
          slot.x + slot.w / 2,
          slot.y - 14,
          mono(18, C.muted, { align: "center", spacing: 0 }),
        );
        kit.strokeRect(
          slot.x - 1,
          slot.y - bar,
          slot.w + 2,
          slot.h + bar + 1,
          "#1A2638",
          3,
        );
      },
    });

    const y = layout.bodyBottom + 90;
    kit.text(
      "> build succeeded · 0 bugs · 100% memories",
      110,
      y,
      mono(22, "#3DD68C", { spacing: 0 }),
    );
    kit.fill(C.cyan, 110, y + 26, 16, 30);
    kit.watermark({ x: 110, y: H - 60, color: C.white, logoColor: C.white });
  },
};

const hmpwk = {
  id: "hm-hmpwk",
  name: "HMPWK",
  category: "himpunan",
  note: "Perencanaan Wilayah & Kota: peta zonasi dan garis kontur.",
  layout: "grid",
  spacing: () => ({ top: 400, side: 90, gap: 30, bottom: 360 }),
  draw(kit, images, layout) {
    const { W, H, stamp, ctx } = kit;
    kit.fill("#EEF3EF");

    ctx.save();
    ctx.strokeStyle = "rgba(5, 75, 174, 0.14)";
    ctx.lineWidth = 2;
    for (let ring = 1; ring < 14; ring++) {
      ctx.beginPath();
      ctx.ellipse(W * 0.78, 180, ring * 70, ring * 46, -0.3, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
    kit.line(0, 360, W, 300, "rgba(5, 10, 18, 0.18)", 16);
    kit.line(640, 0, 700, 380, "rgba(5, 10, 18, 0.18)", 12);

    title(kit, "HMPWK", 90, 200, 620, {
      size: 170,
      weight: 900,
      stretch: "condensed",
      color: C.ink,
    });
    kit.text(
      "PERENCANAAN WILAYAH & KOTA",
      94,
      250,
      mono(20, C.deep, { weight: 600, spacing: 3 }),
    );

    const nx = W - 130;
    const ny = 150;
    const ctx2 = kit.ctx;
    ctx2.beginPath();
    ctx2.moveTo(nx, ny - 60);
    ctx2.lineTo(nx + 30, ny + 30);
    ctx2.lineTo(nx, ny + 10);
    ctx2.lineTo(nx - 30, ny + 30);
    ctx2.closePath();
    ctx2.fillStyle = C.ink;
    ctx2.fill();
    kit.text("U", nx, ny + 70, {
      size: 36,
      weight: 800,
      stretch: "condensed",
      color: C.ink,
      align: "center",
    });

    const zones = [
      "ZONA R-1",
      "ZONA K-2",
      "RTH",
      "ZONA C-1",
      "ZONA P",
      "KAWASAN DTC",
    ];
    const tints = [
      "rgba(8, 120, 237, 0.22)",
      "rgba(18, 200, 244, 0.28)",
      "rgba(61, 214, 140, 0.26)",
    ];
    drawPhotos(kit, images, layout, {
      border: 5,
      borderColor: C.ink,
      after: (slot, index) => {
        kit.fill(
          tints[index % tints.length],
          slot.x,
          slot.y + slot.h - 46,
          slot.w,
          46,
        );
        kit.fill(C.white, slot.x, slot.y + slot.h - 46, 150, 46);
        kit.text(
          zones[index % zones.length],
          slot.x + 14,
          slot.y + slot.h - 16,
          mono(18, C.ink, { weight: 600, spacing: 1 }),
        );
      },
    });

    const y = layout.bodyBottom + 80;
    [0, 1, 2, 3].forEach((i) =>
      kit.fill(i % 2 ? C.white : C.ink, 90 + i * 70, y, 70, 18),
    );
    kit.strokeRect(90, y, 280, 18, C.ink, 2);
    kit.text(
      "0      50     100 M",
      90,
      y + 50,
      mono(16, C.ink, { spacing: 1 }),
    );
    kit.text("LEGENDA", W - 400, y + 10, mono(18, C.text));
    tints.forEach((color, i) => {
      kit.fill(color, W - 400, y + 30 + i * 36, 40, 24);
      kit.text(
        ["PERMUKIMAN", "KOMERSIAL", "RUANG HIJAU"][i],
        W - 346,
        y + 50 + i * 36,
        mono(16, C.ink),
      );
    });
    kit.text(
      `PETA ${stamp.session} · ${stamp.numericDate}`,
      90,
      y + 110,
      mono(20, C.ink),
    );
    kit.watermark({ x: 90, y: H - 60 });
  },
};

const himpunanDesigns = [hms, hme, hma, hmif, hmpwk];

export default himpunanDesigns;
