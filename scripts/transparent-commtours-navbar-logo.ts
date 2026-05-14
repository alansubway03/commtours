/**
 * 將 public/logo-commtours-mark.png 外圍白底變透明（邊緣泛洪，同 remove-logo-background）。
 *
 *   npx tsx scripts/transparent-commtours-navbar-logo.ts
 */
import sharp from "sharp";
import { resolve } from "path";
import { renameSync, unlinkSync } from "fs";

const INPUT = resolve(process.cwd(), "public", "logo-commtours-mark.png");
const TMP = resolve(process.cwd(), "public", "logo-commtours-mark.tmp.png");
const WHITE_TOL = 22;

function isNearWhite(r: number, g: number, b: number): boolean {
  return r >= 255 - WHITE_TOL && g >= 255 - WHITE_TOL && b >= 255 - WHITE_TOL;
}

async function main() {
  const { data, info } = await sharp(INPUT).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  const w = info.width;
  const h = info.height;
  const ch = 4;
  const stride = w * ch;

  const idx = (x: number, y: number) => y * stride + x * ch;
  const k = (x: number, y: number) => y * w + x;

  const bg = new Uint8Array(w * h);
  const queue: [number, number][] = [];

  const tryPush = (x: number, y: number) => {
    if (x < 0 || x >= w || y < 0 || y >= h) return;
    const i = idx(x, y);
    const r = data[i]!;
    const g = data[i + 1]!;
    const b = data[i + 2]!;
    if (!isNearWhite(r, g, b)) return;
    const kk = k(x, y);
    if (bg[kk]) return;
    bg[kk] = 1;
    queue.push([x, y]);
  };

  for (let x = 0; x < w; x++) {
    tryPush(x, 0);
    tryPush(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    tryPush(0, y);
    tryPush(w - 1, y);
  }

  let qi = 0;
  while (qi < queue.length) {
    const [x, y] = queue[qi++]!;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      tryPush(x + dx, y + dy);
    }
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (bg[k(x, y)]!) {
        const i = idx(x, y);
        data[i + 3] = 0;
      }
    }
  }

  await sharp(Buffer.from(data), {
    raw: { width: w, height: h, channels: 4 },
  })
    .png({ compressionLevel: 9 })
    .toFile(TMP);

  unlinkSync(INPUT);
  renameSync(TMP, INPUT);

  console.log("已寫入透明背景:", INPUT, `(${w}×${h})`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
