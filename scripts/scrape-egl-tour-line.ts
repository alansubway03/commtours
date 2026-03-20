/**
 * 【已改用 API】新版長線請用：npm run scrape:egl-api（scrape-egl-tour-line-api.ts）
 * 本檔為舊版 DOM 嘗試，列表由 JS 載入時常 0 筆。
 *
 * 專抓 EGL「長線」列表頁（新版網站），只保留 /itinerary/tour/ 團體連結。
 *
 * 頁面：https://www.egltours.com/website/tour-line/%E9%95%B7%E7%B7%9A
 *
 * 執行：
 *   npx tsx scripts/scrape-egl-tour-line.ts
 *   $env:EGL_MAX_TOURS="80"; npx tsx scripts/scrape-egl-tour-line.ts
 *
 * 輸出：scripts/output/tours-egl-tour-line.json
 */

import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "fs";
import { resolve } from "path";

const LIST_URL =
  "https://www.egltours.com/website/tour-line/%E9%95%B7%E7%B7%9A";
const OUTPUT_DIR = resolve(process.cwd(), "scripts", "output");
const OUT_FILE = resolve(OUTPUT_DIR, "tours-egl-tour-line.json");
const MAX_TOURS = Math.min(500, Math.max(10, parseInt(process.env.EGL_MAX_TOURS || "60", 10) || 60));
const SCROLL_ROUNDS = parseInt(process.env.EGL_SCROLL_ROUNDS || "25", 10) || 25;

const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

/** 標題太廢就當無效，稍後用詳情頁 h1 補 */
const JUNK_TITLE = /^(✈️\s*)?立即報名|了解更多|詳情|按此|click|read more$/i;

function parseTitleMeta(title: string): { days: number; destination: string } {
  let days = 0;
  let destination = "";
  const dm = title.match(/(\d+)\s*天/);
  if (dm) days = parseInt(dm[1], 10);
  const before = title.split(/\d+\s*天/)[0] || "";
  const destM = before.match(/([\u4e00-\u9fff、·\s]+)$/);
  if (destM) destination = destM[1].replace(/^\s+/, "").trim().slice(0, 80);
  return { days, destination };
}

async function fetchDetailTitle(page: import("playwright").Page, url: string): Promise<string> {
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForTimeout(1500);
    const t = await page.evaluate(() => {
      const h1 = document.querySelector("h1");
      if (h1 && h1.textContent && h1.textContent.trim().length > 3) return h1.textContent.trim();
      const og = document.querySelector('meta[property="og:title"]');
      if (og) return (og.getAttribute("content") || "").trim();
      return "";
    });
    return t.replace(/\s+/g, " ").trim();
  } catch {
    return "";
  }
}

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    args: ["--disable-blink-features=AutomationControlled", "--no-sandbox"],
  });
  const context = await browser.newContext({
    userAgent: BROWSER_USER_AGENT,
    viewport: { width: 1280, height: 900 },
    locale: "zh-HK",
    extraHTTPHeaders: { "Accept-Language": "zh-HK,zh;q=0.9,en;q=0.8" },
  });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);

  console.log("開啟列表頁:", LIST_URL);
  await page.goto(LIST_URL, { waitUntil: "load", timeout: 60000 });
  await page.waitForTimeout(8000);

  for (let s = 0; s < SCROLL_ROUNDS; s++) {
    await page.evaluate(() => window.scrollBy(0, 900));
    await page.waitForTimeout(500);
  }
  await page.waitForTimeout(3000);

  const base = "https://www.egltours.com";
  const EXTRACT_BODY = `
  function abs(h) {
    if (!h) return "";
    try { return new URL(h, baseUrl).href.split("#")[0]; } catch (e) { return ""; }
  }
  var tourRe = /\\/itinerary\\/tour\\/[A-Za-z0-9]+/i;
  var seen = {};
  var out = [];
  function pushFromHref(hrefRaw, a) {
    var href = abs(hrefRaw);
    if (!tourRe.test(href) || seen[href]) return;
    seen[href] = true;
    var title = "";
    var price;
    var imageUrl;
    if (a && a.tagName === "A") {
      title = (a.textContent || "").replace(/\\s+/g, " ").trim();
      var card = a.closest("article, [class*='card'], [class*='Card'], [class*='item'], li, section") || a.parentElement;
      if (!title || title.length < 6 || /立即報名|了解更多|^詳情$|^按此/.test(title)) {
        var h = card ? card.querySelector("h1, h2, h3, h4, [class*='title'], [class*='Title']") : null;
        var t2 = h ? (h.textContent || "").replace(/\\s+/g, " ").trim() : "";
        if (t2 && t2.length >= 4 && t2.indexOf("立即報名") === -1) title = t2;
      }
      var priceEl = card ? card.querySelector("[class*='price'], [class*='Price'], .amount") : null;
      if (priceEl) price = priceEl.textContent.replace(/\\s+/g, " ").trim();
      var img = card ? card.querySelector("img") : null;
      if (img) {
        var src = (img.getAttribute("data-src") || img.getAttribute("src") || "").trim();
        if (src && src.indexOf("data:") !== 0) imageUrl = abs(src) || src;
      }
    }
    out.push({ link: href, title: title || "", price: price, imageUrl: imageUrl });
  }
  document.querySelectorAll("a[href]").forEach(function (a) {
    if (out.length >= max) return;
    var h = a.getAttribute("href") || "";
    if (tourRe.test(h)) pushFromHref(h, a);
  });
  if (out.length < max) {
    var html = document.documentElement.innerHTML || "";
    var re = /https?:\\/\\/[^\\s"'<>]+\\/itinerary\\/tour\\/[A-Za-z0-9]+/gi;
    var re2 = /\\/itinerary\\/tour\\/[A-Za-z0-9]+/gi;
    var m;
    var found = {};
    while ((m = re.exec(html)) !== null) found[m[0]] = true;
    while ((m = re2.exec(html)) !== null) found[m[0]] = true;
    Object.keys(found).forEach(function (path) {
      if (out.length >= max) return;
      pushFromHref(path, null);
    });
  }
  return out.slice(0, max);
  `;
  const raws = (await page.evaluate(
    ({ body, max, baseUrl }: { body: string; max: number; baseUrl: string }) =>
      new Function("max", "baseUrl", body)(max, baseUrl),
    { body: EXTRACT_BODY, max: MAX_TOURS, baseUrl: base }
  )) as { link: string; title: string; price?: string; imageUrl?: string }[];

  const detailTitles = process.env.EGL_DETAIL_TITLE === "1";
  const maxDetail = Math.min(raws.length, parseInt(process.env.EGL_DETAIL_MAX || "30", 10) || 30);

  const records: Record<string, unknown>[] = [];
  for (let i = 0; i < raws.length; i++) {
    const row = raws[i]!;
    let title = row.title.trim();
    if (!title || JUNK_TITLE.test(title)) {
      if (detailTitles && i < maxDetail) {
        const d = await fetchDetailTitle(page, row.link);
        if (d && d.length > 4) title = d;
      }
      if (!title || JUNK_TITLE.test(title)) {
        const code = row.link.match(/\/itinerary\/tour\/([A-Za-z0-9]+)/)?.[1] || "";
        title = code ? `EGL 長線團 ${code}` : "EGL 長線團";
      }
    }
    const { days, destination } = parseTitleMeta(title);
    records.push({
      agency: "EGL 東瀛遊",
      type: "longhaul",
      title,
      destination: destination || "—",
      region: "亞洲",
      days: days || 0,
      price_range: row.price && row.price.length > 0 ? row.price : "—",
      departure_date_statuses: [] as { date: string; status: string }[],
      features: [] as string[],
      affiliate_links: { egl: row.link },
      image_url: row.imageUrl || null,
    });
  }

  writeFileSync(OUT_FILE, JSON.stringify(records, null, 2), "utf-8");
  console.log(`已寫入 ${records.length} 筆（僅 /itinerary/tour/）→ ${OUT_FILE}`);
  console.log("若標題仍差，可設 EGL_DETAIL_TITLE=1 對前 N 筆進詳情取 h1（預設 N=EGL_DETAIL_MAX=30）");

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
