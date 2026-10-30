/** @format */

// Salin runtime MediaPipe ke public/ supaya AI booth jalan tanpa internet:
//   public/mediapipe/wasm/*          → loader + WASM (worker & main thread)
//   public/mediapipe/vision_bundle.js → build IIFE untuk public/workers/gesture-worker.js
import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";

const WASM_FILES = [
  "vision_wasm_internal.js",
  "vision_wasm_internal.wasm",
  "vision_wasm_nosimd_internal.js",
  "vision_wasm_nosimd_internal.wasm",
];

const source = new URL("../node_modules/@mediapipe/tasks-vision/", import.meta.url);
const target = new URL("../public/mediapipe/", import.meta.url);
const wasmTarget = new URL("wasm/", target);
const stamp = new URL("VERSION", target);

const { version } = JSON.parse(await readFile(new URL("package.json", source), "utf8"));
const current = await readFile(stamp, "utf8").catch(() => "");

if (current.trim() === version) {
  console.log(`[mediapipe] ${version} sudah ada di public/mediapipe`);
} else {
  await rm(target, { recursive: true, force: true });
  await mkdir(wasmTarget, { recursive: true });
  for (const file of WASM_FILES) {
    await copyFile(new URL(`wasm/${file}`, source), new URL(file, wasmTarget));
  }
  await copyFile(new URL("vision_bundle.js", source), new URL("vision_bundle.js", target));
  await writeFile(stamp, version);
  console.log(`[mediapipe] ${version} disalin ke public/mediapipe`);
}
