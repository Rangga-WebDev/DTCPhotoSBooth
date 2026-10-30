/** @format */

import styles from "./booth.module.css";

const STEPS = ["Hand sign", "Tahan", "Siap", "3 · 2 · 1"];

// active: langkah yang sedang berjalan (-1 = menunggu); complete = semua selesai.
export default function StatusRail({ active, complete, progress, countdown }) {
  const holdFill = complete || active > 1 ? 1 : active === 1 ? progress / 100 : 0;

  return (
    <ol className={styles.steps}>
      {STEPS.map((label, index) => {
        const state =
          complete || index < active ? "done" : index === active ? "active" : "idle";

        return (
          <li key={label} className={styles.step} data-state={state}>
            <span className={styles.stepIndex}>0{index + 1}</span>
            <span className={styles.stepText}>
              {index === 3 && state === "active" && countdown ? countdown : label}
            </span>
            {index === 1 && (
              <span className={styles.holdBar} aria-hidden="true">
                <span style={{ transform: `scaleX(${holdFill})` }} />
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
