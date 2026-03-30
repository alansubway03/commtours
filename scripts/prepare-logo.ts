/**
 * 將原始 logo 圖處理成網站用 public/logo.png：
 * 1. trim：依邊緣顏色裁掉單色留白（適合灰底方圖）
 * 2. 可選：邊緣泛洪去背（與 remove-logo-background 相同邏輯，但背景色取四角平均）
 * 3. 限制最長邊 ≤ LOGO_MAX（預設 512），兼顧 Retina 與檔案大小
 *
 * 用法：
 *   npx tsx scripts/prepare-logo.ts [來源.png]
 * 未帶路徑時嘗試讀環境變數 LOGO_SOURCE 或專案內 public/logo-source.png
 */
import sharp from "sharp";
import { existsSync, writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";

const OUT = resolve(process.cwd(), "public", "logo.png");
const APP_ICON = resolve(process.cwd(), "app", "icon.png");
const APP_APPLE = resolve(process.cwd(), "app", "apple-icon.png");
const LOGO_MAX = 512;
const TRIM_THRESHOLD = 38;
const FLOOD_TOL = 22;

function parseRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function nearColor(
  r: number,
  g: number,
  b: number,
  tr: number,
  tg: number,
  tb: number,
  tol: number
): boolean {
  return (
    Math.abs(r - tr) <= tol &&
    Math.abs(g - tg) <= tol &&
    Math.abs(b - tb) <= tol
  );
}

async function floodTransparent(
  data: Buffer,
  w: number,
  h: number,
  br: number,
  bg: number,
  bb: number
): Promise<Buffer> {
  const ch = 4;
  const stride = w * ch;
  const idx = (x: number, y: number) => y * stride + x * ch;
  const k = (x: number, y: number) => y * w + x;
  const buf = Buffer.from(data);
  const mark = new Uint8Array(w * h);
  const q: [number, number][] = [];

  const tryPush = (x: number, y: number) => {
    if (x < 0 || x >= w || y < 0 || y >= h) return;
    const i = idx(x, y);
    const r = buf[i]!;
    const g = buf[i + 1]!;
    const b = buf[i + 2]!;
    if (!nearColor(r, g, b, br, bg, bb, FLOOD_TOL)) return;
    const kk = k(x, y);
    if (mark[kk]) return;
    mark[kk] = 1;
    q.push([x, y]);
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
  while (qi < q.length) {
    const [x, y] = q[qi++]!;
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      tryPush(x + dx, y + dy);
    }
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (mark[k(x, y)]!) {
        const i = idx(x, y);
        buf[i + 3] = 0;
      }
    }
  }
  return buf;
}

async function main() {
  const arg = process.argv.slice(2).find((a) => !a.startsWith("-"));
  const envSrc = process.env.LOGO_SOURCE;
  const fallback = resolve(process.cwd(), "public", "logo-source.png");
  const input =
    arg ??
    envSrc ??
    (existsSync(fallback) ? fallback : null);

  if (!input || !existsSync(input)) {
    console.error(
      "請指定來源檔：npx tsx scripts/prepare-logo.ts <檔案.png>\n或設定 LOGO_SOURCE，或放置 public/logo-source.png"
    );
    process.exit(1);
  }

  // 先 trim 掉外圍單色（灰底）
  const buf = await sharp(input)
    .ensureAlpha()
    .trim({ threshold: TRIM_THRESHOLD })
    .toBuffer();

  // 四角平均色作為「背景」做泛洪透明（處理 trim 後仍殘留的灰）
  const { data, info } = await sharp(buf)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  const ch = 4;
  const stride = w * ch;
  const pix = (x: number, y: number) => {
    const i = y * stride + x * ch;
    return [data[i]!, data[i + 1]!, data[i + 2]!] as const;
  };
  const corners = [
    pix(0, 0),
    pix(w - 1, 0),
    pix(0, h - 1),
    pix(w - 1, h - 1),
  ];
  const [r0, g0, b0] = corners[0]!;
  const cornersSimilar = corners.every(([r, g, b]) =>
    nearColor(r, g, b, r0, g0, b0, 50)
  );

  const br = Math.round(corners.reduce((s, p) => s + p[0], 0) / 4);
  const bgc = Math.round(corners.reduce((s, p) => s + p[1], 0) / 4);
  const bb = Math.round(corners.reduce((s, p) => s + p[2], 0) / 4);

  const brand = parseRgb("#5c6773");
  const cornersNearBrand = corners.every(([r, g, b]) =>
    nearColor(r, g, b, brand[0], brand[1], brand[2], 45)
  );
  const fr = cornersNearBrand ? brand[0] : br;
  const fg = cornersNearBrand ? brand[1] : bgc;
  const fb = cornersNearBrand ? brand[2] : bb;

  // 四角顏色差異大＝圖案可能貼邊，不做泛洪以免吃掉圖形
  let rgbaBuf: Buffer;
  if (cornersSimilar) {
    rgbaBuf = await floodTransparent(Buffer.from(data), w, h, fr, fg, fb);
  } else {
    rgbaBuf = Buffer.from(data);
    console.warn(
      "[prepare-logo] 四角顏色不一致，僅 trim + 縮放，未做泛洪去背（請手動去背若仍有底）"
    );
  }

  let out = sharp(rgbaBuf, { raw: { width: w, height: h, channels: 4 } });

  const maxDim = Math.max(w, h);
  if (maxDim > LOGO_MAX) {
    out = out.resize({
      width: w >= h ? LOGO_MAX : undefined,
      height: h > w ? LOGO_MAX : undefined,
      fit: "inside",
      kernel: sharp.kernel.lanczos3,
    });
  }

  const pngBuf = await out.png({ compressionLevel: 9 }).toBuffer();
  writeFileSync(OUT, pngBuf);
  mkdirSync(dirname(APP_ICON), { recursive: true });
  writeFileSync(APP_ICON, pngBuf);
  writeFileSync(APP_APPLE, pngBuf);

  const finalMeta = await sharp(OUT).metadata();
  console.log(
    "已輸出",
    OUT,
    `→ ${finalMeta.width}×${finalMeta.height}px（最長邊 ≤ ${LOGO_MAX}）`
  );
  console.log("已同步分頁／PWA 圖示:", APP_ICON, APP_APPLE);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
