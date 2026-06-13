/**
 * 由 public/logo.png 同步全站 favicon / PWA 圖示。
 *
 *   npm run logo:sync-favicons
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import sharp from "sharp";
import toIco from "to-ico";

const SOURCE = resolve(process.cwd(), "public", "logo.png");
const PUBLIC = resolve(process.cwd(), "public");
const APP = resolve(process.cwd(), "app");

async function png(size: number): Promise<Buffer> {
  return sharp(SOURCE)
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

async function main() {
  const [p16, p32, p48, p180, p512] = await Promise.all([
    png(16),
    png(32),
    png(48),
    png(180),
    png(512),
  ]);

  writeFileSync(resolve(PUBLIC, "favicon.ico"), await toIco([p16, p32, p48]));
  writeFileSync(resolve(PUBLIC, "favicon.png"), p48);
  writeFileSync(resolve(PUBLIC, "icon-512.png"), p512);

  mkdirSync(APP, { recursive: true });
  writeFileSync(resolve(APP, "icon.png"), p32);
  writeFileSync(resolve(APP, "apple-icon.png"), p180);
  writeFileSync(resolve(PUBLIC, "apple-icon.png"), p180);

  console.log("已同步 favicon：");
  console.log("  public/favicon.ico (16/32/48)");
  console.log("  public/favicon.png (48×48)");
  console.log("  public/icon-512.png (512×512)");
  console.log("  public/apple-icon.png (180×180)");
  console.log("  app/icon.png (32×32)");
  console.log("  app/apple-icon.png (180×180)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
