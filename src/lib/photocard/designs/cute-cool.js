/** @format */

import { C, drawPhotos, mono, pad2, title } from "./common";

const SKY = "#D8EBFF";
const ICE = "#EAF4FF";

function cloud(kit, x, y, size, color) {
  [
    [0, 0, 0.5],
    [0.42, -0.2, 0.62],
    [0.92, 0.02, 0.48],
    [0.46, 0.18, 0.5],
  ].forEach(([dx, dy, r]) =>
    kit.circle(x + dx * size, y + dy * size, r * size, color),
  );
}

const bubble = {
  id: "cute-bubble",
  name: "Bubble Pop",
  category: "cute",
  note: "Polaroid mungil, gelembung, dan kilau.",
  layout: "polaroid",
  spacing: () => ({
    top: 300,
    side: 90,
    gap: 46,
    bottom: 230,
    pad: 22,
    caption: 86,
  }),
  draw(kit, images, layout) {
    const { W, H, random, stamp } = kit;
    const captions = [
      "cheese!",
      "hehe :)",
      "cute alert",
      "yay!",
      "besties",
      "smile!",
    ];
    kit.fill(SKY);
    for (let i = 0; i < 28; i++) {
      kit.circle(
        random() * W,
        random() * H,
        14 + random() * 70,
        "rgba(255, 255, 255, 0.5)",
        "rgba(8, 120, 237, 0.16)",
        3,
      );
    }
    for (let i = 0; i < 16; i++) {
      kit.sparkle(
        random() * W,
        random() * H,
        10 + random() * 16,
        i % 2 ? C.blue : C.white,
      );
    }

    kit.text("bubble", W / 2, 170, {
      family: "body",
      size: 118,
      weight: 600,
      spacing: -2,
      color: C.deep,
      align: "center",
    });
    kit.text("POP!", W / 2, 258, {
      size: 84,
      weight: 900,
      stretch: "expanded",
      spacing: 6,
      color: C.blue,
      align: "center",
    });

    drawPhotos(kit, images, layout, {
      frameColor: C.white,
      shadow: { color: "rgba(5, 48, 110, 0.22)", blur: 26, y: 10 },
      after: (slot, index) =>
        kit.within(slot, () => {
          const f = slot.frame;
          kit.text(
            captions[index % captions.length],
            f.x + f.w / 2,
            f.y + f.h - 30,
            {
              family: "body",
              size: 32,
              weight: 600,
              color: C.deep,
              align: "center",
            },
          );
        }),
    });

    kit.text(
      stamp.shortDate.toUpperCase(),
      W / 2,
      layout.bodyBottom + 96,
      mono(20, C.deep, { align: "center" }),
    );
    kit.watermark({ x: W / 2, y: H - 56, align: "center", color: C.deep });
  },
};

const cloudNine = {
  id: "cute-cloud",
  name: "Cloud Nine",
  category: "cute",
  note: "Langit biru, awan empuk, sudut foto membulat.",
  layout: "auto",
  spacing: () => ({ top: 330, side: 100, gap: 30, bottom: 320 }),
  draw(kit, images, layout) {
    const { W, H, random, stamp } = kit;
    kit.fill("#BFE0FF");
    kit.fill("#D9EDFF", 0, H * 0.35, W, H * 0.65);
    for (let i = 0; i < 18; i++) {
      kit.star(
        random() * W,
        random() * H,
        8 + random() * 10,
        "rgba(255, 255, 255, 0.9)",
      );
    }
    cloud(kit, -40, 110, 260, C.white);
    cloud(kit, 860, 70, 300, C.white);
    cloud(kit, 780, H - 150, 280, C.white);
    cloud(kit, -60, H - 110, 320, C.white);

    kit.text("cloud nine", W / 2, 230, {
      family: "body",
      size: 124,
      weight: 600,
      spacing: -3,
      color: C.deep,
      align: "center",
    });
    kit.text(
      "DTC 2026 · SOFT EDITION",
      W / 2,
      290,
      mono(20, C.blue, { align: "center", weight: 600, spacing: 4 }),
    );

    drawPhotos(kit, images, layout, {
      border: 14,
      borderColor: C.white,
      radius: 34,
      shadow: { color: "rgba(5, 75, 174, 0.18)", blur: 30, y: 12 },
    });

    kit.text(
      `${stamp.longDate} · ${stamp.time}`,
      W / 2,
      layout.bodyBottom + 100,
      {
        family: "body",
        size: 30,
        weight: 600,
        color: C.deep,
        align: "center",
      },
    );
    kit.watermark({ x: W / 2, y: H - 60, align: "center", color: C.deep });
  },
};

const candy = {
  id: "cute-candy",
  name: "Candy",
  category: "cute",
  note: "Garis permen biru, stiker hati, judul tebal.",
  layout: "grid",
  spacing: () => ({ top: 350, side: 90, gap: 38, bottom: 280 }),
  draw(kit, images, layout) {
    const { W, H, stamp } = kit;
    kit.fill(C.white);
    kit.stripes(ICE, 48, 48, -35);

    const size = kit.fit("SWEET!", W - 200, {
      size: 230,
      weight: 900,
      stretch: "condensed",
    });
    kit.text("SWEET!", W / 2 + 10, 262, {
      size,
      weight: 900,
      stretch: "condensed",
      color: C.ink,
      align: "center",
    });
    kit.text("SWEET!", W / 2, 252, {
      size,
      weight: 900,
      stretch: "condensed",
      color: C.cyan,
      align: "center",
    });
    kit.outlineText("SWEET!", W / 2, 252, {
      size,
      weight: 900,
      stretch: "condensed",
      color: C.ink,
      align: "center",
      lineWidth: 5,
    });

    drawPhotos(kit, images, layout, {
      border: 14,
      borderColor: C.white,
      radius: 28,
      shadow: { color: "rgba(5, 10, 18, 0.16)", blur: 22, y: 8 },
      after: (slot, index) => {
        if (index % 2) return;
        kit.heart(slot.x + slot.w - 18, slot.y + 26, 64, C.blue);
        kit.heart(slot.x + slot.w + 18, slot.y + 70, 34, C.cyan);
      },
    });

    kit.text(
      "SWEET MOMENTS · DTC 2026",
      W / 2,
      layout.bodyBottom + 92,
      mono(22, C.deep, { align: "center", weight: 600, spacing: 4 }),
    );
    kit.text(
      stamp.shortDate.toUpperCase(),
      W / 2,
      layout.bodyBottom + 134,
      mono(20, C.text, { align: "center" }),
    );
    kit.watermark({ x: W / 2, y: H - 56, align: "center" });
  },
};

const stickerSheet = {
  id: "cute-sticker",
  name: "Sticker Sheet",
  category: "cute",
  note: "Foto jadi stiker berserakan di kertas titik.",
  layout: "collage",
  spacing: () => ({ top: 330, side: 70, bottom: 270, border: 22 }),
  draw(kit, images, layout) {
    const { W, H, stamp } = kit;
    kit.fill(C.paper);
    kit.dots("rgba(5, 10, 18, 0.13)", 36, 2.4);

    kit.text("STICKER", 80, 200, {
      size: 170,
      weight: 900,
      stretch: "extra-condensed",
      color: C.ink,
    });
    const offset = kit.measure("STICKER ", {
      size: 170,
      weight: 900,
      stretch: "extra-condensed",
    });
    kit.text("SHEET", 80 + offset, 200, {
      size: 170,
      weight: 900,
      stretch: "extra-condensed",
      color: C.blue,
    });
    kit.text(
      `${pad2(images.length)} STICKERS · PEEL & KEEP`,
      84,
      262,
      mono(20, C.text, { spacing: 3 }),
    );

    const badges = ["WOW", "DTC!", "2026", "YAY", "SUPER", "OK!"];
    drawPhotos(kit, images, layout, {
      frameColor: C.white,
      shadow: { color: "rgba(5, 10, 18, 0.28)", blur: 26, y: 12 },
      after: (slot, index) => {
        const left = index % 2 === 0;
        const x = left ? slot.x + slot.w - 10 : slot.x + 10;
        const y = slot.y + 10;
        kit.circle(x, y, 58, index % 3 ? C.blue : C.ink, C.white, 8);
        kit.text(badges[index % badges.length], x, y + 11, {
          size: 30,
          weight: 900,
          stretch: "condensed",
          color: C.white,
          align: "center",
        });
        kit.star(
          left ? slot.x - 4 : slot.x + slot.w + 4,
          slot.y + slot.h - 10,
          34,
          C.cyan,
        );
      },
    });

    kit.watermark({ x: 80, y: H - 70 });
    kit.text(
      stamp.shortDate.toUpperCase(),
      W - 80,
      H - 70,
      mono(20, C.text, { align: "right" }),
    );
  },
};

const nightShift = {
  id: "cool-night",
  name: "Night Shift",
  category: "cool",
  note: "Tinta gelap, garis biru elektrik, butiran film.",
  layout: "auto",
  spacing: () => ({ top: 330, side: 150, gap: 28, bottom: 280 }),
  draw(kit, images, layout) {
    const { W, H, stamp, ctx } = kit;
    kit.fill(C.ink);

    ctx.save();
    ctx.translate(76, H / 2);
    ctx.rotate(-Math.PI / 2);
    const band = " NIGHT SHIFT · DTC 2026 ·".repeat(12);
    kit.text(
      band,
      0,
      12,
      mono(22, "rgba(247, 249, 251, 0.34)", { align: "center", spacing: 6 }),
    );
    ctx.restore();

    const nightSize = kit.fit("NIGHT SHIFT", W - 150 - 300, {
      size: 190,
      weight: 800,
      stretch: "extra-condensed",
    });
    kit.text("NIGHT", 150, 230, {
      size: nightSize,
      weight: 800,
      stretch: "extra-condensed",
      color: C.paper,
    });
    const offset = kit.measure("NIGHT ", {
      size: nightSize,
      weight: 800,
      stretch: "extra-condensed",
    });
    kit.text("SHIFT", 150 + offset, 230, {
      size: nightSize,
      weight: 800,
      stretch: "extra-condensed",
      color: C.electric,
    });
    kit.text(
      stamp.time,
      W - 90,
      120,
      mono(46, C.cyan, { align: "right", weight: 600, spacing: 0 }),
    );
    kit.text(
      stamp.numericDate,
      W - 90,
      160,
      mono(20, C.muted, { align: "right" }),
    );

    drawPhotos(kit, images, layout, {
      after: (slot) =>
        kit.strokeRect(slot.x + 14, slot.y + 14, slot.w, slot.h, C.electric, 3),
    });

    kit.line(
      150,
      layout.bodyBottom + 70,
      W - 90,
      layout.bodyBottom + 70,
      "rgba(247, 249, 251, 0.3)",
      1.5,
    );
    kit.text(
      "SHOT AFTER DARK AT DTCBOOTH",
      150,
      layout.bodyBottom + 120,
      mono(20, C.paper, { spacing: 3 }),
    );
    kit.watermark({ x: 150, y: H - 60, color: C.paper, logoColor: C.paper });
    kit.grain(0.07);
  },
};

const liveSignal = {
  id: "cool-signal",
  name: "Live Signal",
  category: "cool",
  note: "Tiap foto jadi layar kamera: REC, timecode, bracket.",
  layout: "auto",
  spacing: () => ({ top: 260, side: 70, gap: 30, bottom: 250 }),
  draw(kit, images, layout) {
    const { W, H, stamp } = kit;
    kit.fill("#0A111D");
    kit.grid("rgba(18, 200, 244, 0.06)", 60);

    kit.circle(96, 132, 18, C.signal);
    kit.text("LIVE SIGNAL", 132, 158, {
      size: 96,
      weight: 800,
      stretch: "condensed",
      color: C.paper,
    });
    kit.text(
      "CAM 01 · 1080P · 30FPS",
      W - 70,
      124,
      mono(20, C.cyan, { align: "right" }),
    );
    kit.text(
      `CH ${stamp.session}`,
      W - 70,
      160,
      mono(20, C.muted, { align: "right" }),
    );

    drawPhotos(kit, images, layout, {
      after: (slot, index) => {
        const inset = 26;
        const len = Math.min(64, slot.w * 0.08);
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
          kit.line(x, y, x + len * dx, y, C.white, 4);
          kit.line(x, y, x, y + len * dy, C.white, 4);
        });
        kit.circle(x1 + 30, y1 + 44, 10, C.signal);
        kit.text("REC", x1 + 50, y1 + 53, mono(24, C.white, { weight: 600 }));
        kit.text(
          `00:00:0${index + 1}:${pad2((index * 7 + 12) % 30)}`,
          x2 - 6,
          y2 - 16,
          mono(22, C.white, { align: "right", weight: 600 }),
        );
        kit.text("ISO 800 · F2.0", x1 + 6, y2 - 16, mono(18, C.white));
      },
    });

    kit.text(
      `${stamp.longDate.toUpperCase()} · ${stamp.time}`,
      70,
      layout.bodyBottom + 84,
      mono(20, C.paper),
    );
    kit.watermark({ x: 70, y: H - 60, color: C.paper, logoColor: C.paper });
  },
};

const monochrome = {
  id: "cool-mono",
  name: "Monochrome",
  category: "cool",
  note: "Sampul majalah hitam-putih, foto utama penuh.",
  layout: "magazine",
  spacing: () => ({ side: 70, gap: 22, bottom: 290 }),
  draw(kit, images, layout) {
    const { W, H, stamp, ctx } = kit;
    kit.fill(C.white);
    drawPhotos(kit, images, layout, { filter: "grayscale(1) contrast(1.12)" });

    const cover = layout.slots[0];
    const scrim = ctx.createLinearGradient(0, 0, 0, cover.h * 0.4);
    scrim.addColorStop(0, "rgba(5, 10, 18, 0.62)");
    scrim.addColorStop(1, "rgba(5, 10, 18, 0)");
    kit.fill(scrim, 0, 0, W, cover.h * 0.4);

    title(kit, "MONO", W / 2, 250, W - 120, {
      size: 300,
      weight: 900,
      stretch: "expanded",
      color: C.white,
      align: "center",
    });
    kit.text(
      `ISSUE N° ${stamp.session} · ${stamp.shortDate.toUpperCase()}`,
      W / 2,
      310,
      mono(20, C.white, { align: "center", spacing: 4 }),
    );

    const baseY = cover.h - 150;
    kit.fill(C.white, 60, baseY - 70, 560, 118);
    kit.text("THE HAND SIGN ISSUE", 84, baseY, {
      size: 52,
      weight: 800,
      stretch: "condensed",
      color: C.ink,
    });
    kit.text(
      "DTC 2026 · NO BUTTONS NEEDED",
      86,
      baseY + 34,
      mono(18, C.ink, { spacing: 3 }),
    );

    kit.line(
      70,
      layout.bodyBottom + 60,
      W - 70,
      layout.bodyBottom + 60,
      C.ink,
      3,
    );
    kit.text(
      "GRATIS · DTCBOOTH EDITION",
      70,
      layout.bodyBottom + 110,
      mono(22, C.ink, { weight: 600 }),
    );
    kit.barcode(W - 330, layout.bodyBottom + 84, 260, 70, C.ink);
    kit.watermark({ x: 70, y: H - 58 });
  },
};

const racing = {
  id: "cool-racing",
  name: "Racing",
  category: "cool",
  note: "Bendera kotak-kotak dan nomor start 26.",
  layout: "grid",
  spacing: () => ({ top: 380, side: 80, gap: 30, bottom: 290 }),
  draw(kit, images, layout) {
    const { W, H, stamp, ctx } = kit;
    kit.fill(C.paper);

    const checker = (y, rows) => {
      for (let row = 0; row < rows; row++) {
        for (let x = 0; x < W; x += 36) {
          if ((x / 36 + row) % 2 === 0)
            kit.fill(C.ink, x, y + row * 36, 36, 36);
        }
      }
    };
    checker(0, 2);
    checker(H - 72, 2);

    ctx.save();
    ctx.transform(1, 0, -0.22, 1, 0, 0);
    kit.fill(C.blue, 140, 110, W, 34);
    kit.fill(C.cyan, 190, 152, W, 16);
    ctx.restore();

    ctx.save();
    ctx.transform(1, 0, -0.2, 1, 50, 0);
    kit.text("RACING", 80, 300, {
      size: 170,
      weight: 900,
      stretch: "condensed",
      color: C.ink,
    });
    ctx.restore();
    kit.text("DTC GRAND PRIX 2026", 90, 346, mono(20, C.text, { spacing: 4 }));
    kit.circle(W - 150, 226, 92, C.white, C.ink, 8);
    kit.text("26", W - 150, 262, {
      size: 104,
      weight: 900,
      stretch: "condensed",
      color: C.blue,
      align: "center",
    });

    drawPhotos(kit, images, layout, {
      border: 8,
      borderColor: C.ink,
      after: (slot, index) => {
        kit.fill(C.ink, slot.x, slot.y + slot.h - 44, 120, 44);
        kit.text(
          `LAP ${pad2(index + 1)}`,
          slot.x + 16,
          slot.y + slot.h - 14,
          mono(20, C.white, { weight: 600 }),
        );
      },
    });

    kit.text(
      `FINISH · ${stamp.time} · ${stamp.shortDate.toUpperCase()}`,
      80,
      layout.bodyBottom + 88,
      mono(22, C.ink, { weight: 600 }),
    );
    kit.watermark({ x: 80, y: H - 110 });
  },
};

const cuteCoolDesigns = [
  bubble,
  cloudNine,
  candy,
  stickerSheet,
  nightShift,
  liveSignal,
  monochrome,
  racing,
];

export default cuteCoolDesigns;
