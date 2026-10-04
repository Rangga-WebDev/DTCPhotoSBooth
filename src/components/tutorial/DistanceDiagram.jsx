/** @format */

import styles from "./tutorial.module.css";

// Skala gambar: x = 64 + meter × 176 (viewBox 640 × 220), tanah di y = 180.
const meter = (value) => 64 + value * 176;
const GROUND = 180;
const TICKS = [0, 0.5, 1, 1.5, 2, 2.5, 3];

function Person({ x, faded = false, sign = false }) {
  return (
    <g className={faded ? styles.dgFaded : undefined}>
      <circle cx={x} cy={88} r={11} className={styles.dgPerson} />
      <path
        d={`M${x - 20} ${GROUND}V132C${x - 20} 114 ${x - 12} 106 ${x} 106C${x + 12} 106 ${x + 20} 114 ${x + 20} 132V${GROUND}`}
        className={styles.dgPerson}
      />
      {sign && (
        <g className={styles.dgHand}>
          <polyline points={`${x + 16},116 ${x + 30},100 ${x + 34},78`} />
          <polyline points={`${x + 30},64 ${x + 34},78 ${x + 38},64`} />
          <circle cx={x + 34} cy={78} r={2.2} />
          <circle cx={x + 30} cy={64} r={2.8} className={styles.dgTip} />
          <circle cx={x + 38} cy={64} r={2.8} className={styles.dgTip} />
        </g>
      )}
    </g>
  );
}

export default function DistanceDiagram() {
  return (
    <div className={styles.diagram}>
      <svg
        viewBox="0 0 640 220"
        className={styles.diagramSvg}
        role="img"
        aria-label="Tampak samping: kamera di kiri, posisi ideal berdiri 1 sampai 2 meter dari kamera."
      >
        <rect
          x={meter(1)}
          y={28}
          width={meter(2) - meter(1)}
          height={GROUND - 28}
          className={styles.dgBand}
        />
        <path
          d={`M${meter(1)} 28V${GROUND}M${meter(2)} 28V${GROUND}`}
          className={styles.dgBandEdge}
        />
        <path
          d={`M${meter(1)} 40H${meter(2)}M${meter(1)} 33V47M${meter(2)} 33V47`}
          className={styles.dgDimension}
        />

        <path d="M90 120L632 44M90 120L632 176" className={styles.dgCone} />

        <path d={`M24 ${GROUND}H632`} className={styles.dgGround} />
        {TICKS.map((value) => (
          <path
            key={value}
            d={`M${meter(value)} ${GROUND}V${GROUND + (Number.isInteger(value) ? 12 : 7)}`}
            className={styles.dgTick}
          />
        ))}

        <g className={styles.dgCamera}>
          <path
            d={`M64 136V${GROUND}M64 148L48 ${GROUND}M64 148L80 ${GROUND}`}
          />
          <rect x={40} y={104} width={40} height={32} />
          <rect x={80} y={111} width={10} height={18} />
        </g>

        <Person x={meter(0.53)} faded />
        <Person x={meter(1.5)} sign />
        <Person x={meter(2.82)} faded />
      </svg>

      <span
        className={`dtc-micro ${styles.dgLabel} ${styles.dgLabelTop} ${styles.dgLabelAccent}`}
        style={{ left: `${(meter(1.5) / 640) * 100}%`, top: "13%" }}
      >
        Ideal · 1–2 m
      </span>
      <span
        className={`dtc-micro ${styles.dgLabel} ${styles.dgLabelTop}`}
        style={{ left: `${(60 / 640) * 100}%`, top: "44%" }}
      >
        Kamera
      </span>
      {[0, 1, 2, 3].map((value) => (
        <span
          key={value}
          className={`dtc-micro ${styles.dgLabel}`}
          style={{ left: `${(meter(value) / 640) * 100}%`, top: "91%" }}
        >
          {value === 0 ? "0" : `${value} m`}
        </span>
      ))}
    </div>
  );
}
