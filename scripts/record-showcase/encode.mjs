// Cuts the raw recordings at their marks and writes the start page videos and posters.
//   node scripts/record-showcase/encode.mjs        (after record.mjs light and dark)
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { OUT } from "./config.mjs";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

// Each video is a list of [raw clip, from mark, offset, to mark, offset].
const VIDEOS = {
  hero: [
    ["hero-1", "loaded", -0.5, "started", 3],
    ["hero-2", "ready", -1.5, "end", 0],
  ],
  "run-button": [["run-button", "ready", -0.5, "end", 0]],
  "open-from-link": [
    ["open-from-link-1", "loaded", -0.5, "loaded", 3],
    ["open-from-link-2", "ready", -1.5, "end", 0],
  ],
};

fs.mkdirSync(path.join(root, "static/videos"), { recursive: true });
for (const mode of ["light", "dark"]) {
  const dir = path.join(OUT, mode);
  const marks = JSON.parse(
    fs.readFileSync(path.join(dir, "marks.json"), "utf8"),
  );
  for (const [name, segments] of Object.entries(VIDEOS)) {
    const inputs = [];
    const filters = [];
    segments.forEach(([clip, from, fromOffset, to, toOffset], i) => {
      const start = Math.max(0, marks[clip][from] + fromOffset);
      const end = marks[clip][to] + toOffset;
      inputs.push("-i", path.join(dir, `${clip}.webm`));
      filters.push(
        `[${i}:v]trim=${start.toFixed(2)}:${end.toFixed(2)},setpts=PTS-STARTPTS,fps=24,scale=1280:-2[v${i}]`,
      );
    });
    const joined = segments.map((_, i) => `[v${i}]`).join("");
    filters.push(`${joined}concat=n=${segments.length}:v=1:a=0[out]`);
    const video = path.join(root, "static/videos", `${name}-${mode}.webm`);
    execFileSync("ffmpeg", [
      "-v",
      "error",
      "-y",
      ...inputs,
      "-filter_complex",
      filters.join(";"),
      "-map",
      "[out]",
      "-c:v",
      "libvpx-vp9",
      "-crf",
      "36",
      "-b:v",
      "0",
      "-row-mt",
      "1",
      "-an",
      video,
    ]);
    // The poster is the last frame, so the page shows the finished state before the video loads.
    const poster = path.join(
      root,
      "static/img/marketing",
      `${name}-${mode}.jpg`,
    );
    execFileSync("ffmpeg", [
      "-v",
      "error",
      "-y",
      "-sseof",
      "-0.5",
      "-i",
      video,
      "-frames:v",
      "1",
      "-q:v",
      "4",
      poster,
    ]);
    console.log(
      `${name}-${mode}: ${(fs.statSync(video).size / 1e6).toFixed(1)} MB`,
    );
  }
}
