/**
 * 從 public/logo.png 邊緣做「白色連通區域」泛洪，將外圍白底變透明。
 * 圖案內被黑線包住的白色（例如燈塔塔身）理論上會保留。
 *
 *   npx tsx scripts/remove-logo-background.ts
 */
import sharp from "sharp";
import { resolve, dirname } from "path";
import { copyFileSync, mkdirSync } from "fs";

const ROOT = resolve(process.cwd(), "public", "logo.png");
const APP_ICON = resolve(process.cwd(), "app", "icon.png");
const APP_APPLE = resolve(process.cwd(), "app", "apple-icon.png");

const WHITE_TOL = 18; // 0–255，略吃 JPEG/壓縮色差

function isNearWhite(r: number, g: number, b: number): boolean {
  return (
    r >= 255 - WHITE_TOL &&
    g >= 255 - WHITE_TOL &&
    b >= 255 - WHITE_TOL
  );
}

async function main() {
  const { data, info } = await sharp(ROOT)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

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
    const dirs = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const;
    for (const [dx, dy] of dirs) {
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
    .toFile(ROOT);

  mkdirSync(dirname(APP_ICON), { recursive: true });
  copyFileSync(ROOT, APP_ICON);
  copyFileSync(ROOT, APP_APPLE);

  console.log("已寫入透明背景:", ROOT, `(${w}×${h})`);
  console.log("已同步分頁圖示: app/icon.png, app/apple-icon.png");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
