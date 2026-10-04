/** @format */

import { C, drawPhotos, mono, pad2, title } from "./common";

function sprockets(kit, x, width, color) {
  for (let y = 40; y < kit.H - 30; y += 64) {
    kit.roundRect(x + (width - 34) / 2, y, 34, 24, 5, color);
  }
}

const dateNight = {
  id: "couple-date",
  name: "Date Night",
  category: "couple",
  note: "Rol film bioskop dan tiket ADMIT TWO.",
  layout: "film",
  spacing: () => ({ top: 360, side: 150, gap: 26, bottom: 330 }),
  draw(kit, images, layout) {
    const { W, H, stamp } = kit;
    kit.fill(C.ink);
    kit.fill("#0E1A30", 110, 0, W - 220, H);
    sprockets(kit, 22, 88, C.paper);
    sprockets(kit, W - 110, 88, C.paper);

    kit.text("date night", W / 2, 190, {
      family: "body",
      size: 128,
      weight: 600,
      spacing: -3,
      color: C.paper,
      align: "center",
    });
    kit.heart(W / 2 + 330, 110, 60, C.electric);
    kit.text(
      `NOW SHOWING · ${stamp.shortDate.toUpperCase()} · ${stamp.time}`,
      W / 2,
      262,
      mono(20, C.cyan, { align: "center", spacing: 3 }),
    );
    kit.line(150, 300, W - 150, 300, "rgba(247, 249, 251, 0.25)", 1.5);

    drawPhotos(kit, images, layout, {
      after: (slot, index) =>
        kit.text(
          `${pad2(index + 1)}A`,
          slot.x + slot.w - 12,
          slot.y + slot.h + 20,
          mono(16, C.muted, { align: "right" }),
        ),
    });

    const top = layout.bodyBottom + 70;
    kit.roundRect(150, top, W - 300, 170, 16, C.paper);
    kit.line(W - 400, top + 16, W - 400, top + 154, C.muted, 2, [8, 8]);
    kit.text("ADMIT TWO", 190, top + 104, {
      size: 88,
      weight: 900,
      stretch: "condensed",
      color: C.ink,
    });
    kit.text(`ROW D · SEAT ${stamp.session}`, 194, top + 146, mono(18, C.text));
    kit.logo({ x: W - 275, y: top + 34, w: 150, align: "center" });
    kit.watermark({
      x: W / 2,
      y: H - 56,
      align: "center",
      color: C.paper,
      logoColor: C.paper,
    });
  },
};

const twoOfUs = {
  id: "couple-two",
  name: "Two of Us",
  category: "couple",
  note: "Minimal putih, YOU + ME besar, stempel EST. 2026.",
  layout: "feature",
  spacing: () => ({ top: 360, side: 80, gap: 24, bottom: 300 }),
  draw(kit, images, layout) {
    const { W, H, stamp } = kit;
    kit.fill(C.white);

    const size = 250;
    const you = kit.measure("YOU", {
      size,
      weight: 900,
      stretch: "extra-condensed",
    });
    const plus = kit.measure(" + ", {
      size,
      weight: 300,
      stretch: "extra-condensed",
    });
    const me = kit.measure("ME", {
      size,
      weight: 900,
      stretch: "extra-condensed",
    });
    let x = (W - you - plus - me) / 2;
    kit.text("YOU", x, 290, {
      size,
      weight: 900,
      stretch: "extra-condensed",
      color: C.ink,
    });
    x += you;
    kit.text(" + ", x, 290, {
      size,
      weight: 300,
      stretch: "extra-condensed",
      color: C.blue,
    });
    x += plus;
    kit.text("ME", x, 290, {
      size,
      weight: 900,
      stretch: "extra-condensed",
      color: C.ink,
    });

    drawPhotos(kit, images, layout);

    const cx = W - 170;
    const cy = layout.bodyBottom + 150;
    kit.circle(cx, cy, 104, null, C.blue, 4);
    kit.circle(cx, cy, 86, null, C.blue, 1.5);
    kit.text(
      "EST.",
      cx,
      cy - 24,
      mono(20, C.blue, { align: "center", weight: 600 }),
    );
    kit.text("2026", cx, cy + 30, {
      size: 58,
      weight: 900,
      stretch: "condensed",
      color: C.blue,
      align: "center",
    });
    kit.text("DTC", cx, cy + 62, mono(18, C.blue, { align: "center" }));

    kit.text("two of us,", 80, layout.bodyBottom + 130, {
      family: "body",
      size: 60,
      weight: 600,
      spacing: -1,
      color: C.ink,
    });
    kit.text("one frame.", 80, layout.bodyBottom + 196, {
      family: "body",
      size: 60,
      weight: 600,
      spacing: -1,
      color: C.blue,
    });
    kit.watermark({ x: 80, y: H - 60, color: C.text });
  },
};

const airMail = {
  id: "couple-airmail",
  name: "Air Mail",
  category: "couple",
  note: "Amplop pos udara, perangko DTC, cap tanggal.",
  layout: "polaroid",
  spacing: () => ({
    top: 340,
    side: 110,
    gap: 44,
    bottom: 300,
    pad: 20,
    caption: 64,
  }),
  draw(kit, images, layout) {
    const { W, H, stamp, ctx } = kit;
    kit.fill(C.white);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, H);
    ctx.rect(36, 36, W - 72, H - 72);
    ctx.clip("evenodd");
    kit.fill(C.blue);
    kit.stripes(C.navy, 40, 40, -45);
    ctx.restore();
    kit.fill("#F4F1EA", 36, 36, W - 72, H - 72);

    kit.text(
      "PAR AVION · AIR MAIL",
      110,
      150,
      mono(22, C.blue, { weight: 600, spacing: 5 }),
    );
    kit.text("with love,", 110, 246, {
      family: "body",
      size: 96,
      weight: 600,
      spacing: -2,
      color: C.ink,
    });

    const sx = W - 280;
    kit.fill(C.white, sx, 90, 170, 200);
    kit.strokeRect(sx + 10, 100, 150, 180, C.blue, 2, [6, 5]);
    kit.logo({ x: sx + 85, y: 132, w: 110, align: "center" });
    kit.text(
      "DTC 26",
      sx + 85,
      262,
      mono(18, C.blue, { align: "center", weight: 600 }),
    );
    kit.circle(sx - 40, 214, 84, null, "rgba(5, 10, 18, 0.55)", 3);
    kit.text(
      stamp.numericDate,
      sx - 40,
      222,
      mono(18, "rgba(5, 10, 18, 0.7)", { align: "center" }),
    );
    [0, 1, 2].forEach((i) =>
      kit.line(
        sx - 170,
        186 + i * 22,
        sx + 60,
        186 + i * 22,
        "rgba(5, 10, 18, 0.35)",
        3,
      ),
    );

    const notes = ["from me", "to you", "xoxo", "p.s.", "always", "us"];
    drawPhotos(kit, images, layout, {
      frameColor: C.white,
      shadow: { color: "rgba(5, 10, 18, 0.2)", blur: 18, y: 8 },
      after: (slot, index) =>
        kit.within(slot, () => {
          const f = slot.frame;
          kit.text(notes[index % notes.length], f.x + 22, f.y + f.h - 22, {
            family: "body",
            size: 26,
            weight: 600,
            color: C.deep,
          });
        }),
    });

    kit.text(
      "TO: DTCBOOTH, DISCOVERY TECHNOLOGY CREATIVE",
      110,
      layout.bodyBottom + 96,
      mono(20, C.ink, { spacing: 2 }),
    );
    kit.watermark({ x: 110, y: H - 84, color: C.text });
  },
};

const squad = {
  id: "friend-squad",
  name: "Squad",
  category: "friendship",
  note: "SQUAD GOALS tebal, foto ditempel selotip.",
  layout: "grid",
  spacing: () => ({ top: 380, side: 90, gap: 44, bottom: 280 }),
  draw(kit, images, layout) {
    const { W, H, stamp, ctx } = kit;
    kit.fill(C.cyan);
    kit.dots("rgba(5, 10, 18, 0.12)", 30, 3);

    kit.text("SQUAD", 80, 230, {
      size: 230,
      weight: 900,
      stretch: "condensed",
      color: C.ink,
    });
    kit.text("GOALS", 88, 318, {
      size: 90,
      weight: 800,
      stretch: "expanded",
      spacing: 14,
      color: C.white,
    });
    kit.circle(W - 170, 170, 104, C.ink);
    kit.text(pad2(images.length), W - 170, 196, {
      size: 96,
      weight: 900,
      stretch: "condensed",
      color: C.cyan,
      align: "center",
    });
    kit.text("MEMBERS", W - 170, 232, mono(16, C.white, { align: "center" }));

    drawPhotos(kit, images, layout, {
      border: 12,
      borderColor: C.white,
      after: (slot, index) => {
        const tape = (x, y, angle) => {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate((angle * Math.PI) / 180);
          kit.fill("rgba(247, 249, 251, 0.72)", -60, -18, 120, 36);
          ctx.restore();
        };
        tape(slot.x + 30, slot.y - 6, -32 + index * 6);
        tape(slot.x + slot.w - 30, slot.y - 6, 30 - index * 5);
      },
    });

    kit.text(
      `${stamp.shortDate.toUpperCase()} · NO ONE LEFT BEHIND`,
      90,
      layout.bodyBottom + 92,
      mono(22, C.ink, { weight: 600 }),
    );
    kit.watermark({ x: 90, y: H - 60 });
  },
};

const yearbook = {
  id: "friend-yearbook",
  name: "Yearbook",
  category: "friendship",
  note: "Buku tahunan CLASS OF 2026 dengan gelar tiap foto.",
  layout: "polaroid",
  spacing: () => ({
    top: 330,
    side: 90,
    gap: 40,
    bottom: 240,
    pad: 18,
    caption: 96,
    tilt: false,
  }),
  draw(kit, images, layout) {
    const { W, H, stamp } = kit;
    const awards = [
      "PALING HEBOH",
      "PALING FOTOGENIK",
      "PALING KALEM",
      "PALING TELAT",
      "PALING BERISIK",
      "PALING RAJIN",
    ];
    kit.fill("#F3EFE6");
    kit.fill(C.navy, 0, 0, W, 250);
    kit.text(
      "CLASS OF",
      90,
      118,
      mono(28, C.cyan, { weight: 600, spacing: 8 }),
    );
    kit.text("2026", 86, 222, {
      size: 130,
      weight: 900,
      stretch: "condensed",
      color: C.white,
    });
    kit.text("DTC YEARBOOK", W - 90, 222, {
      size: 64,
      weight: 800,
      stretch: "condensed",
      color: C.white,
      align: "right",
    });
    kit.text(
      `VOL. ${stamp.session}`,
      W - 90,
      118,
      mono(22, C.muted, { align: "right" }),
    );

    drawPhotos(kit, images, layout, {
      frameColor: C.white,
      shadow: { color: "rgba(5, 10, 18, 0.12)", blur: 10, y: 4 },
      after: (slot, index) => {
        const f = slot.frame;
        kit.text(awards[index % awards.length], f.x + f.w / 2, f.y + f.h - 50, {
          size: Math.min(34, f.w / 12),
          weight: 800,
          stretch: "condensed",
          color: C.ink,
          align: "center",
        });
        kit.text(
          "MOST LIKELY TO SMILE",
          f.x + f.w / 2,
          f.y + f.h - 20,
          mono(14, C.text, { align: "center", spacing: 1 }),
        );
      },
    });

    kit.watermark({ x: W / 2, y: H - 60, align: "center", color: C.text });
  },
};

const comic = {
  id: "friend-comic",
  name: "Comic",
  category: "friendship",
  note: "Panel komik, raster titik, balon CEKREK!",
  layout: "grid",
  spacing: () => ({ top: 330, side: 60, gap: 26, bottom: 250 }),
  draw(kit, images, layout) {
    const { W, H, stamp, ctx } = kit;
    kit.fill(C.white);
    kit.dots("rgba(8, 120, 237, 0.22)", 22, 5, [0, 0, W, 300]);
    kit.dots("rgba(8, 120, 237, 0.14)", 22, 3.5, [0, H - 260, W, 260]);

    ctx.save();
    ctx.translate(90, 250);
    ctx.rotate(-0.05);
    kit.text("BESTIES!", 0, 0, {
      size: 190,
      weight: 900,
      stretch: "condensed",
      color: C.ink,
    });
    kit.text("BESTIES!", -8, -8, {
      size: 190,
      weight: 900,
      stretch: "condensed",
      color: C.cyan,
    });
    kit.outlineText("BESTIES!", -8, -8, {
      size: 190,
      weight: 900,
      stretch: "condensed",
      color: C.ink,
      lineWidth: 5,
    });
    ctx.restore();

    const shouts = ["CEKREK!", "WOW!", "HAHA!", "GAS!", "SIP!", "YES!"];
    drawPhotos(kit, images, layout, {
      after: (slot, index) => {
        kit.strokeRect(slot.x, slot.y, slot.w, slot.h, C.ink, 8);
        if (index % 2) return;
        const bx = slot.x + slot.w - 150;
        const by = slot.y + 30;
        kit.roundRect(bx, by, 132, 64, 32, C.white, C.ink, 5);
        ctx.beginPath();
        ctx.moveTo(bx + 36, by + 60);
        ctx.lineTo(bx + 18, by + 98);
        ctx.lineTo(bx + 64, by + 62);
        ctx.fillStyle = C.white;
        ctx.fill();
        ctx.strokeStyle = C.ink;
        ctx.lineWidth = 5;
        ctx.stroke();
        kit.text(shouts[index % shouts.length], bx + 66, by + 44, {
          size: 32,
          weight: 900,
          stretch: "condensed",
          color: C.ink,
          align: "center",
        });
      },
    });

    kit.text(
      `EPISODE ${stamp.session} · ${stamp.shortDate.toUpperCase()}`,
      60,
      layout.bodyBottom + 80,
      mono(22, C.ink, { weight: 600 }),
    );
    kit.watermark({ x: 60, y: H - 56 });
  },
};

const lineUp = {
  id: "group-lineup",
  name: "Line Up",
  category: "group",
  note: "Papan tinggi badan dan papan nama rombongan.",
  layout: "auto",
  spacing: () => ({ top: 330, side: 120, gap: 26, bottom: 330 }),
  draw(kit, images, layout) {
    const { W, H, stamp } = kit;
    kit.fill("#E9EEF3");
    const bodyTop = layout.slots[0].y;
    let mark = 200;
    for (let y = bodyTop; y < layout.bodyBottom; y += 40) {
      const major = (y - bodyTop) % 120 === 0;
      kit.line(0, y, major ? 100 : 60, y, C.ink, major ? 3 : 1.5);
      kit.line(W - (major ? 100 : 60), y, W, y, C.ink, major ? 3 : 1.5);
      if (major) {
        kit.text(String(mark), 12, y - 8, mono(16, C.ink));
        mark -= 10;
      }
    }

    kit.text("LINE UP", 120, 240, {
      size: 200,
      weight: 900,
      stretch: "extra-condensed",
      color: C.ink,
    });
    kit.text(
      "THE USUAL SUSPECTS · DTC 2026",
      126,
      294,
      mono(20, C.deep, { spacing: 3 }),
    );

    drawPhotos(kit, images, layout);

    const top = layout.bodyBottom + 60;
    kit.fill(C.ink, 300, top, W - 600, 200);
    kit.text(
      "DTCBOOTH DEPT.",
      W / 2,
      top + 50,
      mono(20, C.cyan, { align: "center", spacing: 4 }),
    );
    kit.text(`N° ${stamp.session}-${pad2(images.length)}`, W / 2, top + 132, {
      size: 80,
      weight: 900,
      stretch: "condensed",
      color: C.white,
      align: "center",
    });
    kit.text(
      stamp.numericDate,
      W / 2,
      top + 176,
      mono(20, C.white, { align: "center" }),
    );
    kit.watermark({ x: W / 2, y: H - 52, align: "center" });
  },
};

const team = {
  id: "group-team",
  name: "Team DTC",
  category: "group",
  note: "Kartu tim ala jersey: nomor punggung tiap foto.",
  layout: "grid",
  spacing: () => ({ top: 360, side: 80, gap: 26, bottom: 280 }),
  draw(kit, images, layout) {
    const { W, H, stamp } = kit;
    kit.fill(C.navy);
    kit.stripes("rgba(0, 158, 247, 0.12)", 14, 58, 90);
    kit.fill(C.electric, 0, 0, W, 16);

    kit.text("TEAM", 80, 220, {
      size: 190,
      weight: 900,
      stretch: "condensed",
      color: C.white,
    });
    const offset = kit.measure("TEAM ", {
      size: 190,
      weight: 900,
      stretch: "condensed",
    });
    kit.text("DTC", 80 + offset, 220, {
      size: 190,
      weight: 900,
      stretch: "condensed",
      color: C.cyan,
    });
    kit.text(
      `SEASON 2026 · ROSTER ${pad2(images.length)}`,
      84,
      290,
      mono(22, C.muted, { spacing: 4 }),
    );

    drawPhotos(kit, images, layout, {
      border: 6,
      borderColor: C.electric,
      after: (slot, index) => {
        const number = String((Number(stamp.session) + index * 7) % 99 || 26);
        kit.text(number, slot.x + slot.w - 20, slot.y + slot.h - 20, {
          size: Math.min(140, slot.h * 0.42),
          weight: 900,
          stretch: "condensed",
          color: "rgba(247, 249, 251, 0.85)",
          align: "right",
        });
      },
    });

    kit.text(
      `${stamp.longDate.toUpperCase()} · ${stamp.time}`,
      80,
      layout.bodyBottom + 86,
      mono(20, C.white),
    );
    kit.watermark({ x: 80, y: H - 60, color: C.white, logoColor: C.white });
  },
};

const mainStage = {
  id: "group-stage",
  name: "Main Stage",
  category: "group",
  note: "Poster konser: foto utama penuh, lineup di bawah.",
  layout: "magazine",
  spacing: () => ({
    side: 70,
    gap: 22,
    bottom: 420,
    insetTop: 30,
  }),
  draw(kit, images, layout) {
    const { W, H, stamp, ctx } = kit;
    kit.fill(C.ink);
    drawPhotos(kit, images, layout);

    const cover = layout.slots[0];
    const fade = ctx.createLinearGradient(0, cover.h * 0.55, 0, cover.h);
    fade.addColorStop(0, "rgba(5, 10, 18, 0)");
    fade.addColorStop(1, "rgba(5, 10, 18, 0.9)");
    kit.fill(fade, 0, cover.h * 0.55, W, cover.h * 0.45);

    kit.fill(C.electric, 60, 60, 190, 50);
    kit.text("LIVE", 155, 97, {
      size: 40,
      weight: 900,
      stretch: "expanded",
      color: C.ink,
      align: "center",
    });
    title(kit, "MAIN STAGE", 60, cover.h - 60, W - 120, {
      size: 200,
      weight: 900,
      stretch: "extra-condensed",
      color: C.white,
    });

    const y = layout.bodyBottom + 90;
    kit.text(
      "DTC 2026 PRESENTS",
      W / 2,
      y,
      mono(22, C.cyan, { align: "center", spacing: 6 }),
    );
    kit.text("THE BIG FRAME · THE HAND SIGNS · YOU", W / 2, y + 74, {
      size: 54,
      weight: 800,
      stretch: "condensed",
      color: C.white,
      align: "center",
    });
    kit.text(
      `${stamp.longDate.toUpperCase()} · DOORS ${stamp.time}`,
      W / 2,
      y + 128,
      mono(20, C.muted, { align: "center" }),
    );
    kit.barcode(W / 2 - 160, y + 170, 320, 60, C.white);
    kit.watermark({
      x: W / 2,
      y: H - 50,
      align: "center",
      color: C.white,
      logoColor: C.white,
    });
  },
};

const peopleDesigns = [
  dateNight,
  twoOfUs,
  airMail,
  squad,
  yearbook,
  comic,
  lineUp,
  team,
  mainStage,
];

export default peopleDesigns;
