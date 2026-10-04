/** @format */

import DtcLogo from "../brand/DtcLogo";
import styles from "./landing.module.css";

// Siluet orang pada viewBox 120 × 90: [cx, cy, radius kepala].
const SOLO = [[60, 40, 13]];
const GROUP = [
  [20, 47, 9],
  [44, 38, 10.5],
  [71, 41, 10],
  [97, 48, 9],
];

function shoulders([cx, cy, r]) {
  const half = r * 2.3;
  const top = cy + r * 0.6;
  return `M${cx - half} 90C${cx - half} ${top} ${cx + half} ${top} ${cx + half} 90Z`;
}

function Shot({ tone = "", group = false, wide = false }) {
  const classes = [styles.shot, tone && styles[tone], wide && styles.shotWide]
    .filter(Boolean)
    .join(" ");
  return (
    <span className={classes}>
      <svg viewBox="0 0 120 90" preserveAspectRatio="xMidYMax slice">
        {(group ? GROUP : SOLO).map((person) => (
          <g key={person[0]}>
            <circle cx={person[0]} cy={person[1]} r={person[2]} />
            <path d={shoulders(person)} />
          </g>
        ))}
      </svg>
    </span>
  );
}

// Tiga lembar photocard yang seolah baru keluar dari printer booth.
export default function PrintStack() {
  return (
    <div className={styles.prints} aria-hidden="true">
      <div className={styles.stage}>
        <figure className={`${styles.sheet} ${styles.sheetSquad}`}>
          <div className={styles.squadBody}>
            <p className={styles.squadTitle}>
              <span>Squad</span>
              <span>Mode</span>
            </p>
            <Shot tone="shotInk" group wide />
            <div className={styles.squadStub}>
              <span>05 people</span>
              <span>DTC-0281</span>
            </div>
          </div>
        </figure>

        <figure className={`${styles.sheet} ${styles.sheetBlueprint}`}>
          <div className={styles.bpBody}>
            <div className={styles.bpHead}>
              <span>Blueprint</span>
              <span>Sheet 02</span>
            </div>
            <div className={styles.bpGrid}>
              <Shot tone="shotBlue" />
              <Shot tone="shotBlue" />
              <Shot tone="shotBlue" />
              <Shot tone="shotBlue" />
            </div>
            <div className={styles.bpFoot}>
              <DtcLogo
                variant="mark"
                plate
                decorative
                width="20cqi"
                sizes="96px"
              />
              <span>Scale 1 : 1</span>
            </div>
          </div>
        </figure>

        <figure className={`${styles.sheet} ${styles.sheetStrip}`}>
          <div className={styles.stripBody}>
            <div className={styles.stripHead}>
              <DtcLogo variant="mark" decorative width="30cqi" sizes="120px" />
              <span>DTC / 2026</span>
            </div>
            <Shot />
            <Shot group />
            <Shot />
            <p className={styles.stripWord}>Discovery Technology Creative</p>
            <div className={styles.stripBand}>
              <b>DTCBooth</b>
              <span>N° 0281</span>
            </div>
          </div>
        </figure>
      </div>
    </div>
  );
}
