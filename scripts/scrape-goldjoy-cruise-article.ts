/**
 * 金怡假期 — 郵輪旅行團文章頁
 * https://goldjoy.com/articles/cruise-tours
 *
 * 從頁面內所有 `tour?code=` 連結擷取團號，並取鄰近區塊文字解析價錢、出發日、成團狀態；
 * 圖片優先取區塊內第一張 Contentful / 官網圖，否則再開詳情頁取 og:image。
 *
 * 執行：npm run scrape:goldjoy-cruise-article
 * 輸出：scripts/output/tours-goldjoy-cruise-article.json
 *
 *   GOLDJOY_SKIP_IMAGES=1  不造訪詳情頁補圖
 */

import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "fs";
import { resolve } from "path";
import { canonicalTourRegion } from "../lib/canonicalTourRegion";

const ARTICLE_URL = "https://goldjoy.com/articles/cruise-tours";
const BASE = "https://www.goldjoy.com";
const OUTPUT_DIR = resolve(process.cwd(), "scripts", "output");
const OUT_FILE = resolve(OUTPUT_DIR, "tours-goldjoy-cruise-article.json");
const SKIP_DETAIL_IMAGE = process.env.GOLDJOY_SKIP_IMAGES === "1";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const MONTHS_EN = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

function toDisplayDate(y: number, m: number, d: number): string {
  const dt = new Date(y, m - 1, d);
  const dd = String(dt.getDate()).padStart(2, "0");
  const mon = MONTHS_EN[dt.getMonth()];
  const yy = String(dt.getFullYear()).slice(-2);
  return `${dd} ${mon} ${yy}`;
}

/** 從文章區塊文字解析出發日 + 狀態 */
function parseDepartureStatuses(blob: string): { date: string; status: "成團" | "快將成團" | "未成團" }[] {
  const out: { date: string; status: "成團" | "快將成團" | "未成團" }[] = [];
  const seen = new Set<string>();
  const b = blob.replace(/\s+/g, " ");

  const pushDate = (
    y: number,
    mo: number,
    day: number,
    status: "成團" | "快將成團" | "未成團"
  ) => {
    const label = toDisplayDate(y, mo, day);
    const key = `${label}:${status}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ date: label, status });
  };

  const inferYear = (month: number): number => {
    const now = new Date();
    let y = now.getFullYear();
    if (month < now.getMonth() + 1) y += 1;
    return y;
  };

  // 【已成團】… 或 【快將成團】… 後面常跟日期
  const bracketRe = /【\s*(已成團|快將成團)\s*】\s*([^【]*?)(?=【|$)/g;
  let m: RegExpExecArray | null;
  while ((m = bracketRe.exec(b)) !== null) {
    const statusRaw = m[1];
    const status: "成團" | "快將成團" =
      statusRaw === "快將成團" ? "快將成團" : "成團";
    const chunk = m[2];

    for (const dm of chunk.matchAll(/(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/g)) {
      pushDate(Number(dm[1]), Number(dm[2]), Number(dm[3]), status);
    }
    // 例：10月3、17日
    for (const dm of chunk.matchAll(
      /(\d{1,2})\s*月\s*(\d{1,2}(?:\s*[、,]\s*\d{1,2})+)\s*日/g
    )) {
      const mo = Number(dm[1]);
      const y = inferYear(mo);
      for (const part of dm[2].split(/[、,]+/)) {
        const day = parseInt(part.trim(), 10);
        if (day > 0 && day < 32) pushDate(y, mo, day, status);
      }
    }
    for (const dm of chunk.matchAll(/(?<!\d)(\d{1,2})\s*月\s*(\d{1,2})\s*日/g)) {
      const mo = Number(dm[1]);
      const day = Number(dm[2]);
      const y = inferYear(mo);
      pushDate(y, mo, day, status);
    }
  }

  // 單獨「2026年11月4日」無括號時，當未成團（文章有時只寫一行出發日）
  if (out.length === 0) {
    for (const dm of b.matchAll(/(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/g)) {
      pushDate(Number(dm[1]), Number(dm[2]), Number(dm[3]), "未成團");
    }
  }

  return out;
}

function parsePriceRange(blob: string): string {
  const m =
    blob.match(/HK\$\s*[\d,]+(?:\s*起)?/i) ||
    blob.match(/HKD\s*[\d,]+(?:\s*起)?/i) ||
    blob.match(/\$\s*[\d,]+(?:\s*起)?/);
  if (!m) return "—";
  return m[0].replace(/\s+/g, " ").trim();
}

/** 優先「N天…郵輪」，否則第一個「N天」 */
function parseDays(blob: string, title: string): number {
  const hay = `${title} ${blob}`;
  const m1 = hay.match(/(\d+)\s*天[^。]{0,40}郵輪/);
  if (m1) return Math.max(0, parseInt(m1[1], 10));
  const m2 = hay.match(/(\d+)\s*天/);
  return m2 ? Math.max(0, parseInt(m2[1], 10)) : 0;
}

function absolutizeImage(src: string): string | null {
  const s = src.trim();
  if (!s || s.startsWith("data:")) return null;
  if (/logo\.png|\/templates\/gk_/i.test(s)) return null;
  if (s.startsWith("//")) return `https:${s}`;
  if (s.startsWith("http")) return s;
  try {
    return new URL(s, BASE).href;
  } catch {
    return null;
  }
}

/** 第一團的 Range 常從整頁開頭算起，會含頁首／日曆／JSON-LD */
function trimArticlePreamble(blob: string): string {
  const b = blob.replace(/\s+/g, " ");
  if (!/(2804\s*1188|SunMon|CALLBACK|March20\d{2}|"@context)/i.test(b)) return b;
  const idx = b.search(
    /20[2-4]\d極致奢華|南極探索|【\s*\d+\s*天[^】]{0,40}南極/
  );
  if (idx > 0) return b.slice(idx);
  return b;
}

/** 過長標題（含頁首或整段複製）時，截到「旅程亮點」前並縮短 */
function refineTitle(blob: string, code: string, title: string): string {
  const t = title.replace(/\s+/g, " ").trim();
  const bad =
    /Whatsapp|2804|SunMon|CALLBACK|March20|@context|Submit\s+CALLBACK/i.test(
      t
    );
  if (t.length < 100 && !bad) return t;

  const head = blob.slice(0, 700);
  const cut = /旅程亮點|行程亮點|\s+住宿七晚|\s+專業香港領隊|\s+一次過暢遊/.exec(
    head
  );
  const slice = (cut ? head.slice(0, cut.index) : head)
    .replace(/\s+/g, " ")
    .trim();
  const cleaned = slice
    .replace(new RegExp(`\\s*${code}\\s*$`, "i"), "")
    .trim();
  const out = cleaned.slice(0, 130) || `金怡郵輪｜${code}`;
  return out.length >= 8 ? out : `金怡郵輪｜${code}`;
}

/** 用 Range 在「上一個行程連結之後」到「本連結之後」切塊，避免整篇文章 blob 混在一起 */
const EXTRACT_TOUR_LINKS_JS = `
(function () {
  function hrefCode(a) {
    var h = a.getAttribute("href") || "";
    var m = h.match(/[?&]code=([^&]+)/i);
    return m ? decodeURIComponent(m[1]).trim() : null;
  }

  var all = Array.from(document.querySelectorAll('a[href*="code="]')).filter(function (a) {
    return /tour/i.test(a.getAttribute("href") || "");
  });

  all.sort(function (a, b) {
    if (a === b) return 0;
    var pos = a.compareDocumentPosition(b);
    if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
    if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1;
    return 0;
  });

  var links = [];
  var seen = {};
  for (var i = 0; i < all.length; i++) {
    var c = hrefCode(all[i]);
    if (!c || seen[c]) continue;
    seen[c] = true;
    links.push(all[i]);
  }

  var container =
    document.querySelector("article") ||
    document.querySelector("main") ||
    document.body;

  var rows = [];
  for (var i = 0; i < links.length; i++) {
    var a = links[i];
    var rng = document.createRange();
    if (i === 0) rng.setStart(container, 0);
    else rng.setStartAfter(links[i - 1]);
    rng.setEndAfter(a);

    var blob = String(rng.toString() || "").replace(/\\s+/g, " ").trim();
    if (blob.length > 12000) blob = blob.slice(0, 12000);

    var frag = rng.cloneContents();
    var img = frag.querySelector("img[src]");
    var imgUrl = img ? img.getAttribute("src") : null;

    var href = a.getAttribute("href") || "";
    var full = href;
    try {
      full = new URL(href, location.origin).href;
    } catch (e) {}

    var code = hrefCode(a);
    var title = String(a.textContent || "").replace(/\\s+/g, " ").trim();
    if (/^https?:\\/\\//i.test(title) || title.length < 6) {
      var lines = blob.split(/[\\n\\r]+|(?=推廣)/);
      title = "";
      for (var L = 0; L < lines.length; L++) {
        var line = lines[L].trim();
        if (
          line.length > 12 &&
          !/^https?:\\/\\//i.test(line) &&
          line.indexOf("HK$") !== 0 &&
          line.indexOf("HKD") !== 0
        ) {
          title = line.slice(0, 220);
          break;
        }
      }
      if (!title) title = "金怡郵輪｜" + code;
    }
    if (title.length > 300) title = title.slice(0, 300);

    rows.push({ code: code, link: full, title: title, blob: blob, imgSrc: imgUrl });
  }

  return rows;
})()
`;

async function scrapeDetailOgImage(
  page: import("playwright").Page,
  code: string
): Promise<string | null> {
  const url = `${BASE}/tour?code=${encodeURIComponent(code)}`;
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(1500);
    return await page.evaluate(`(function(){
      var og = document.querySelector('meta[property="og:image"]');
      var c = og && og.getAttribute('content') ? og.getAttribute('content').trim() : '';
      if (!c) return null;
      try { return new URL(c, location.origin).href; } catch(e) { return c.indexOf('http')===0 ? c : null; }
    })()`);
  } catch {
    return null;
  }
}

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    args: ["--disable-blink-features=AutomationControlled", "--no-sandbox"],
  });
  const context = await browser.newContext({ userAgent: UA });
  const page = await context.newPage();

  await page.goto(ARTICLE_URL, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.waitForTimeout(3000);

  const raw = (await page.evaluate(EXTRACT_TOUR_LINKS_JS)) as {
    code: string;
    link: string;
    title: string;
    blob: string;
    imgSrc: string | null;
  }[];

  const records: Record<string, unknown>[] = [];

  for (let i = 0; i < raw.length; i++) {
    const r = raw[i]!;
    const blob = i === 0 ? trimArticlePreamble(r.blob) : r.blob;
    const title =
      r.title && r.title.length > 5
        ? refineTitle(blob, r.code, r.title)
        : refineTitle(blob, r.code, `金怡郵輪｜${r.code}`);
    const price_range = parsePriceRange(blob);
    const days = parseDays(blob, title);
    const departure_date_statuses = parseDepartureStatuses(blob);
    const region = String(
      canonicalTourRegion({ title, destination: "—", region: "—" })
    );

    let image_url: string | null = r.imgSrc ? absolutizeImage(r.imgSrc) : null;
    if (!image_url && !SKIP_DETAIL_IMAGE) {
      image_url = await scrapeDetailOgImage(page, r.code);
    }

    let affiliateUrl = r.link.startsWith("http")
      ? r.link
      : `${BASE}/tour?code=${encodeURIComponent(r.code)}`;
    affiliateUrl = affiliateUrl.replace(
      /^https?:\/\/(?:www\.)?goldjoy\.com/i,
      "https://www.goldjoy.com"
    );

    records.push({
      source_key: `goldjoy:${r.code}`,
      agency: "金怡假期",
      type: "cruise",
      title,
      destination: "—",
      region,
      days,
      price_range,
      departure_date_statuses,
      features: ["郵輪旅行團"],
      affiliate_links: { goldjoy: affiliateUrl },
      image_url: image_url ?? null,
    });

    console.log(`[${i + 1}/${raw.length}] ${r.code}`);
  }

  await browser.close();

  writeFileSync(OUT_FILE, JSON.stringify(records, null, 2), "utf-8");
  console.log(`共 ${records.length} 筆 → ${OUT_FILE}`);
  console.log(
    "npx tsx scripts/push-tours-to-supabase.ts --upsert scripts/output/tours-goldjoy-cruise-article.json"
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
