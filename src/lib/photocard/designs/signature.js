/** @format */

import { C, drawPhotos, mono, pad2, specRow, title } from "./common";

const poster = {
  id: "sig-poster",
  name: "Poster",
  category: "signature",
  note: "DTC / BOOTH ala poster, sama seperti layar depan.",
  layout: "auto",
  spacing: () => ({ top: 430, side: 72, gap: 24, bottom: 250 }),
  draw(kit, images, layout) {
    const { W, H, stamp } = kit;
    kit.fill(C.paper);
    for (let x = 72; x < W; x += 88) {
      kit.line(x, 0, x, H, "rgba(5, 10, 18, 0.045)", 1);
    }

    kit.text("DTC / 2026", 72, 70, mono(20, C.text));
    kit.text(
      "AI PHOTO EXPERIENCE",
      W - 72,
      70,
      mono(20, C.text, { align: "right" }),
    );
    kit.line(72, 96, W - 72, 96, C.ink, 2);
    kit.text("DTC", 64, 300, {
      size: 180,
      weight: 900,
      stretch: "expanded",
      spacing: -4,
      color: C.ink,
    });
    kit.text("BOOTH", W - 72, 300, {
      size: 180,
      weight: 800,
      stretch: "extra-condensed",
      color: C.blue,
      align: "right",
    });
    kit.line(72, 372, 136, 372, C.blue, 4);
    kit.text("CAPTURE YOUR MOMENT.", 156, 381, {
      size: 24,
      weight: 700,
      stretch: "expanded",
      spacing: 5,
      color: C.ink,
    });

    drawPhotos(kit, images, layout, {
      after: (slot, index) => {
        kit.strokeRect(slot.x, slot.y, slot.w, slot.h, C.ink, 2);
        kit.fill(C.ink, slot.x, slot.y, 64, 34);
        kit.text(
          pad2(index + 1),
          slot.x + 32,
          slot.y + 24,
          mono(18, C.paper, { align: "center", weight: 600, spacing: 0 }),
        );
      },
    });

    const y = layout.bodyBottom;
    kit.line(72, y + 44, W - 72, y + 44, C.ink, 2);
    kit.text(stamp.longDate.toUpperCase(), 72, y + 90, mono(20, C.ink));
    kit.text(
      `SESSION ${stamp.session}`,
      W - 72,
      y + 90,
      mono(20, C.blue, { align: "right", weight: 600 }),
    );
    kit.watermark({ x: 72, y: H - 60 });
    kit.text(
      `N° ${stamp.serial}`,
      W - 72,
      H - 60,
      mono(20, C.text, { align: "right" }),
    );
  },
};

const blueprint = {
  id: "sig-blueprint",
  name: "Blueprint",
  category: "signature",
  note: "Gambar teknik biru, lengkap dengan kop lembar kerja.",
  layout: "grid",
  spacing: () => ({ top: 310, side: 96, gap: 40, bottom: 340 }),
  draw(kit, images, layout) {
    const { W, H, stamp } = kit;
    kit.fill(C.deep);
    kit.grid("rgba(247, 249, 251, 0.07)", 40);
    kit.grid("rgba(247, 249, 251, 0.14)", 200, 1.5);
    kit.strokeRect(40, 40, W - 80, H - 80, "rgba(247, 249, 251, 0.6)", 2);

    title(kit, "BLUEPRINT", 96, 200, 760, {
      size: 140,
      weight: 800,
      stretch: "condensed",
      color: C.white,
    });
    kit.text(
      `SHEET ${stamp.session}`,
      W - 96,
      116,
      mono(22, C.white, { align: "right", weight: 600 }),
    );
    kit.text(`PHOTO DRAWING NO. ${stamp.serial}`, 96, 250, mono(20, C.cyan));

    const dimY = layout.slots[0].y - 26;
    kit.line(96, dimY, W - 96, dimY, "rgba(247, 249, 251, 0.75)", 1.5);
    [96, W - 96].forEach((x) =>
      kit.line(x, dimY - 12, x, dimY + 12, C.white, 1.5),
    );
    kit.fill(C.deep, W / 2 - 90, dimY - 14, 180, 28);
    kit.text(
      "SCALE 1 : 1",
      W / 2,
      dimY + 6,
      mono(16, C.white, { align: "center" }),
    );

    drawPhotos(kit, images, layout, { border: 8, borderColor: C.white });

    const top = layout.bodyBottom + 70;
    const height = 180;
    const logoCell = 200;
    kit.strokeRect(96, top, W - 192, height, C.white, 2);
    kit.line(
      W - 96 - logoCell,
      top,
      W - 96 - logoCell,
      top + height,
      C.white,
      1.5,
    );
    specRow(
      kit,
      [
        ["PROJECT", "DTCBooth"],
        ["DATE", stamp.numericDate],
        ["TIME", stamp.time],
        ["SHEET", stamp.session],
      ],
      {
        x: 96,
        y: top + 64,
        width: W - 192 - logoCell,
        label: mono(16, C.cyan),
        value: {
          size: 52,
          weight: 800,
          stretch: "condensed",
          color: C.white,
          min: 22,
        },
        divider: C.white,
      },
    );
    kit.logo({
      x: W - 96 - logoCell / 2,
      y: top + 36,
      w: 140,
      color: C.white,
      align: "center",
    });
    kit.watermark({ x: 96, y: H - 72, color: C.white, mark: false });
  },
};

const circuit = {
  id: "sig-circuit",
  name: "Circuit",
  category: "signature",
  note: "Jalur sirkuit dan node, seperti di dalam huruf logo DTC.",
  layout: "feature",
  spacing: () => ({ top: 330, side: 90, gap: 28, bottom: 290 }),
  draw(kit, images, layout) {
    const { W, H, stamp, random, ctx } = kit;
    kit.fill(C.navy);

    const top = layout.slots[0].y;
    ctx.save();
    ctx.strokeStyle = "rgba(0, 158, 247, 0.6)";
    ctx.lineWidth = 3;
    ctx.lineJoin = "round";
    for (let i = 0; i < 16; i++) {
      const left = i % 2 === 0;
      const dir = left ? 1 : -1;
      const y = top + random() * (layout.bodyBottom - top);
      const x0 = left ? 0 : W;
      const x1 = x0 + dir * (12 + random() * 18);
      const rise = (random() < 0.5 ? -1 : 1) * 22;
      const x2 = x1 + dir * 22;
      const x3 = x2 + dir * (6 + random() * 14);
      ctx.beginPath();
      ctx.moveTo(x0, y);
      ctx.lineTo(x1, y);
      ctx.lineTo(x2, y + rise);
      ctx.lineTo(x3, y + rise);
      ctx.stroke();
      kit.circle(x3 + dir * 7, y + rise, 7, C.navy, C.electric, 3);
    }
    ctx.restore();

    kit.logo({ x: 90, y: 72, w: 170, color: C.white });
    ["DISCOVERY", "TECHNOLOGY", "CREATIVE"].forEach((word, index) => {
      kit.text(word, 300, 112 + index * 44, {
        size: 30,
        weight: 700,
        stretch: "expanded",
        spacing: 8,
        color: C.white,
      });
    });
    kit.text(
      "CIRCUIT",
      W - 90,
      112,
      mono(20, C.cyan, { align: "right", weight: 600 }),
    );
    kit.text("EDITION", W - 90, 144, mono(20, C.cyan, { align: "right" }));

    drawPhotos(kit, images, layout, {
      after: (slot) => {
        kit.strokeRect(slot.x, slot.y, slot.w, slot.h, C.electric, 3);
        [
          [slot.x, slot.y],
          [slot.x + slot.w, slot.y],
          [slot.x, slot.y + slot.h],
          [slot.x + slot.w, slot.y + slot.h],
        ].forEach(([x, y]) => kit.circle(x, y, 7, C.navy, C.electric, 3));
      },
    });

    const y = layout.bodyBottom + 80;
    kit.line(90, y, W - 90, y, C.electric, 3);
    const items = [
      ["DATE", stamp.numericDate],
      ["TIME", stamp.time],
      ["SESSION", stamp.session],
      ["DTC", "2026"],
    ];
    const step = (W - 180) / (items.length - 1);
    items.forEach(([label, value], index) => {
      const x = 90 + step * index;
      const align =
        index === 0 ? "left" : index === items.length - 1 ? "right" : "center";
      kit.circle(x, y, 9, C.navy, C.cyan, 3);
      kit.text(label, x, y + 46, mono(16, C.muted, { align }));
      kit.text(value, x, y + 84, mono(24, C.white, { align, weight: 600 }));
    });
    kit.watermark({
      x: W / 2,
      y: H - 50,
      color: C.white,
      align: "center",
      logoColor: C.white,
    });
  },
};

const pass = {
  id: "sig-pass",
  name: "Access Pass",
  category: "signature",
  note: "Tiket all-area DTC 2026, lengkap dengan sobekan dan barcode.",
  layout: "auto",
  spacing: () => ({ top: 390, side: 110, gap: 22, bottom: 480 }),
  draw(kit, images, layout) {
    const { W, H, stamp } = kit;
    kit.fill(C.blue);
    kit.roundRect(44, 44, W - 88, H - 88, 36, C.paper);

    const cut = layout.bodyBottom + 70;
    kit.circle(44, cut, 34, C.blue);
    kit.circle(W - 44, cut, 34, C.blue);
    kit.line(96, cut, W - 96, cut, C.muted, 3, [14, 12]);

    kit.text("ACCESS", 106, 256, {
      size: 200,
      weight: 800,
      stretch: "extra-condensed",
      color: C.ink,
    });
    kit.text("ALL AREA · DTC 2026", 112, 326, {
      size: 24,
      weight: 700,
      stretch: "expanded",
      spacing: 5,
      color: C.blue,
    });
    kit.text("N°", W - 110, 140, mono(20, C.text, { align: "right" }));
    kit.text(stamp.session, W - 110, 256, {
      size: 130,
      weight: 900,
      stretch: "condensed",
      color: C.blue,
      align: "right",
    });

    drawPhotos(kit, images, layout, { radius: 14 });

    specRow(
      kit,
      [
        ["HOLDER", "DTCBooth"],
        ["DATE", stamp.shortDate],
        ["TIME", stamp.time],
        ["PHOTOS", pad2(images.length)],
      ],
      {
        x: 110,
        y: cut + 80,
        width: W - 220,
        label: mono(16, C.text),
        value: {
          size: 44,
          weight: 800,
          stretch: "condensed",
          color: C.ink,
          min: 20,
        },
      },
    );
    kit.barcode(110, cut + 180, 620, 110, C.ink);
    kit.logo({ x: W - 110, y: cut + 172, w: 170, align: "right" });
    kit.watermark({ x: 110, y: H - 88, mark: false, color: C.text });
  },
};

const strip = {
  id: "sig-strip",
  name: "Photostrip",
  category: "signature",
  note: "Dua photostrip klasik 2 × 6 inci di satu lembar 4R, tinggal digunting.",
  layout: "strip",
  spacing: () => ({ top: 236, side: 48, gap: 16, bottom: 214 }),
  draw(kit, images, layout) {
    const { W, H, stamp } = kit;
    const half = W / 2;
    kit.fill(C.white);

    [0, half].forEach((left) => {
      const cx = left + half / 2;
      kit.logo({ x: cx, y: 48, w: 230, variant: "full", align: "center" });
      const y = layout.bodyBottom;
      title(kit, "DISCOVERY TECHNOLOGY CREATIVE", cx, y + 70, half - 96, {
        size: 18,
        weight: 700,
        stretch: "expanded",
        spacing: 4,
        color: C.deep,
        align: "center",
        min: 10,
      });
      kit.text(
        stamp.longDate.toUpperCase(),
        cx,
        y + 112,
        mono(16, C.text, { align: "center", spacing: 1 }),
      );
      kit.watermark({
        x: cx,
        y: H - 44,
        align: "center",
        mark: false,
        color: C.muted,
      });
    });

    drawPhotos(kit, images, layout);
    kit.line(half, 20, half, H - 20, C.grey, 2, [10, 10]);

    // Sesi 1–2 foto: sisa strip diisi wordmark, bukan ruang kosong.
    const word = { weight: 900, stretch: "expanded", size: 260, min: 40 };
    const width = half - 96;
    const big = kit.fit("DTC", width, word);
    const year = kit.fit("2026", width, word);
    const block = big * 0.72 + 28 + year * 0.72 + 48 + 16;
    const { free } = layout;
    if (free.h < block + 80) return;

    const top = free.y + (free.h - block) / 2;
    [0, half].forEach((left) => {
      const cx = left + half / 2;
      kit.text("DTC", cx, top + big * 0.72, {
        ...word,
        size: big,
        color: C.blue,
        align: "center",
      });
      kit.outlineText("2026", cx, top + big * 0.72 + 28 + year * 0.72, {
        ...word,
        size: year,
        color: C.blue,
        align: "center",
        lineWidth: 3,
      });
      kit.text(
        `STRIP N° ${stamp.session}`,
        cx,
        top + block,
        mono(16, C.text, { align: "center", spacing: 4 }),
      );
    });
  },
};

const signatureDesigns = [poster, blueprint, circuit, pass, strip];

export default signatureDesigns;
