/** @format */

// Salin runtime WASM MediaPipe ke public/ supaya booth jalan tanpa internet.
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";

const FILES = [
  "vision_wasm_internal.js",
  "vision_wasm_internal.wasm",
  "vision_wasm_nosimd_internal.js",
  "vision_wasm_nosimd_internal.wasm",
];

const source = new URL(
  "../node_modules/@mediapipe/tasks-vision/",
  import.meta.url,
);
const target = new URL("../public/mediapipe/wasm/", import.meta.url);
const stamp = new URL("VERSION", target);

const { version } = JSON.parse(
  await readFile(new URL("package.json", source), "utf8"),
);
const current = await readFile(stamp, "utf8").catch(() => "");

if (current.trim() === version) {
  console.log(`[mediapipe] wasm ${version} sudah ada di public/mediapipe/wasm`);
} else {
  await mkdir(target, { recursive: true });
  for (const file of FILES) {
    await copyFile(new URL(`wasm/${file}`, source), new URL(file, target));
  }
  await writeFile(stamp, version);
  console.log(`[mediapipe] wasm ${version} disalin ke public/mediapipe/wasm`);
}
