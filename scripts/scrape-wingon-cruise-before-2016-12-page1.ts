/**
 * 永安旅遊（wingontravel）郵輪列表：抓「2016/12 前出發」的旅行團（只抓 page 1）
 *
 * 來源頁：
 *   https://www.wingontravel.com/cruises/list?port=all
 *
 * 產出：
 *   scripts/output/tours-wingon-cruise-before-2016-12-page1.json
 *
 * 用法：
 *   npx tsx scripts/scrape-wingon-cruise-before-2016-12-page1.ts
 */

import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "fs";
import { resolve } from "path";
import { canonicalTourRegion } from "../lib/canonicalTourRegion";

const OUTPUT_DIR = resolve(process.cwd(), "scripts", "output");
const OUT_FILE = resolve(
  OUTPUT_DIR,
  "tours-wingon-cruise-before-2016-12-page1.json"
);

const LIST_URL = "https://www.wingontravel.com/cruises/list?port=all";
const AGENCY = "永安旅遊";
const TYPE = "cruise";

// 「2016年12月前」= 小於 2016/12/01
const CUTOFF = new Date(2016, 11, 1); // months: 0-based (11 => December)

const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function toDisplayDate(d: Date): string {
  const dd = String(d.getDate()).padStart(2, "0");
  const mon = MONTHS_EN[d.getMonth()];
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd} ${mon} ${yy}`;
}

function parseCandidateDate(s: string): Date | null {
  const t = String(s ?? "").trim();
  if (!t) return null;

  // 例：2016年11月20日
  let m = t.match(/^(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日$/);
  if (m) {
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const day = Number(m[3]);
    const dt = new Date(y, mo - 1, day);
    if (dt.getFullYear() !== y) return null;
    return dt;
  }

  // 例：2016/11/20 或 2016-11-20
  m = t.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
  if (m) {
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const day = Number(m[3]);
    const dt = new Date(y, mo - 1, day);
    if (dt.getFullYear() !== y) return null;
    return dt;
  }

  // 例：20/11/2016 or 1/2/16
  m = t.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
  if (m) {
    const day = Number(m[1]);
    const mo = Number(m[2]);
    let y = Number(m[3]);
    if (y < 100) y += 2000;
    const dt = new Date(y, mo - 1, day);
    if (dt.getFullYear() !== y) return null;
    return dt;
  }

  return null;
}

function extractStatusFromText(text: string): "成團" | "快將成團" | "未成團" {
  if (/快將成團|快滿成團/i.test(text)) return "快將成團";
  if (/已成團|成團|已滿|額滿|滿團/i.test(text)) return "成團";
  return "未成團";
}

function pickFirstPrice(text: string): string | null {
  const m =
    text.match(/HK\$\s*[\d,]+(?:\s*起)?/i) ||
    text.match(/\$HK\s*[\d,]+(?:\s*起)?/i);
  if (!m) return null;
  return String(m[0]).replace(/\s+/g, " ").trim();
}

function pickDaysFromText(text: string): number {
  const m = text.match(/(\d+)\s*天/i);
  if (m) return Math.max(0, Number(m[1]));
  const n = text.match(/(\d+)\s*晚/i);
  if (n) return Math.max(0, Number(n[1]));
  return 0;
}

// 用字串傳 page.evaluate：避免在本專案環境觸發 __name 等問題
const EXTRACT_WINGON_CRUISE_LIST_JS = `
(function () {
  const results = [];
  const anchors = Array.from(document.querySelectorAll("a[href*='cruises']"));
  const seen = new Set();

  function normalizeUrl(href) {
    try { return new URL(href, location.origin).href; } catch (e) { return href; }
  }

  function getMainImageUrl(el) {
    const img = el.querySelector("img");
    if (!img) return null;
    const src =
      img.getAttribute("data-src") ||
      img.getAttribute("data-lazy") ||
      img.getAttribute("src") ||
      "";
    const s = String(src).trim();
    if (!s || s.startsWith("data:") || /placeholder|1x1/i.test(s)) return null;
    try { return new URL(s, location.origin).href; } catch (e) { return s; }
  }

  function pickTitle(card, a) {
    const header = card.querySelector("h1,h2,h3,h4");
    if (header && header.textContent) return String(header.textContent).replace(/\\s+/g, " ").trim();
    const t = (a.getAttribute("title") || a.textContent || "").trim();
    return String(t).replace(/\\s+/g, " ").trim();
  }

  function pickPriceText(cardText) {
    const m =
      cardText.match(/HK\\$\\s*[\\d,]+(?:\\s*起)?/i) ||
      cardText.match(/\\$HK\\s*[\\d,]+(?:\\s*起)?/i);
    if (!m) return null;
    return String(m[0]).replace(/\\s+/g, " ").trim();
  }

  function extractDateCandidates(cardText) {
    const cands = [];

    // 2016年11月20日
    for (const m of cardText.matchAll(/(\\d{4})\\s*年\\s*(\\d{1,2})\\s*月\\s*(\\d{1,2})\\s*日/g)) {
      cands.push(m[1] + "年" + m[2] + "月" + m[3] + "日");
    }

    // 2016/11/20 或 2016-11-20
    for (const m of cardText.matchAll(/(\\d{4})[\\/\\-\\.](\\d{1,2})[\\/\\-\\.](\\d{1,2})/g)) {
      cands.push(m[1] + "/" + m[2] + "/" + m[3]);
    }

    // 20/11/2016 or 1/2/16
    for (const m of cardText.matchAll(/(\\d{1,2})[\\/\\-\\.](\\d{1,2})[\\/\\-\\.](\\d{2,4})/g)) {
      cands.push(m[1] + "/" + m[2] + "/" + m[3]);
    }

    return Array.from(new Set(cands)).slice(0, 8);
  }

  for (const a of anchors) {
    const href = a.getAttribute("href") || a.href || "";
    const full = normalizeUrl(href);

    if (/\\/cruises\\/list/i.test(full)) continue;
    if (!full || !/\\/cruises/i.test(full)) continue;
    if (seen.has(full)) continue;

    let card =
      a.closest(
        ".product-item, .tour-card, .product-card, .card, li, article, [class*='product'], [class*='tour'], [class*='item']"
      ) || a.parentElement;
    if (!card) continue;

    // 有些連結的「最近容器」可能不含價格；往上找包含 HK$ 的父層
    let probe = card;
    let cardText = "";
    let priceText = null;
    for (let i = 0; i < 10; i++) {
      if (!probe) break;
      cardText = String(probe.textContent || "").replace(/\\s+/g, " ").trim();
      priceText = pickPriceText(cardText);
      if (priceText) break;
      probe = probe.parentElement;
    }
    const title = pickTitle(probe || card, a);
    if (!title || title.length < 2) continue;

    seen.add(full);

    results.push({
      title: title,
      link: full,
      cardText: cardText,
      priceText: priceText,
      imageUrl: getMainImageUrl(probe || card),
      dateCandidates: extractDateCandidates(cardText),
    });
  }

  return results;
})()
`;

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    args: ["--disable-blink-features=AutomationControlled", "--no-sandbox"],
  });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });

  const page = await context.newPage();
  await page.goto(LIST_URL, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.waitForSelector("a[href*='/cruises/']", { timeout: 30000 });
  await page.waitForTimeout(2500);

  // debug：截圖確認頁面是否真的顯示郵輪商品卡（含價格/出發日期）
  try {
    const screenshotPath = resolve(OUTPUT_DIR, "debug-wingon-cruise-list-page1.png");
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`debug screenshot: ${screenshotPath}`);
  } catch {
    // ignore screenshot errors
  }

  const rawItems = (await page.evaluate(EXTRACT_WINGON_CRUISE_LIST_JS)) as {
    title: string;
    link: string;
    cardText: string;
    priceText: string | null;
    imageUrl: string | null;
    dateCandidates: string[];
  }[];

  if (rawItems.length > 0) {
    const years = new Set<number>();
    let minYear: number | null = null;
    for (const it of rawItems) {
      for (const cand of it.dateCandidates ?? []) {
        const dt = parseCandidateDate(cand);
        if (!dt) continue;
        const y = dt.getFullYear();
        years.add(y);
        if (minYear == null || y < minYear) minYear = y;
      }
    }
    console.log("debug: page1 候選中解析到的年份=", [...years].sort((a, b) => a - b), "minYear=", minYear);
  }

  if (rawItems.length === 0) {
    const hrefSamples = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("a[href*='cruises']"))
        .slice(0, 30)
        .map((a) =>
          a.getAttribute("href") ||
          (a instanceof HTMLAnchorElement ? a.href : "") ||
          ""
        );
    });
    console.log("debug: rawItems=0，頁面前 30 個 cruises href：", hrefSamples);
  }

  const kept: any[] = [];
  const seenLink = new Set<string>();

  for (const it of rawItems) {
    if (!it.dateCandidates?.length) continue;

    let parsed: Date | null = null;
    for (const cand of it.dateCandidates) {
      const dt = parseCandidateDate(cand);
      if (!dt) continue;
      parsed = dt;
      break;
    }
    if (!parsed) continue;
    if (!(parsed < CUTOFF)) continue;
    if (seenLink.has(it.link)) continue;

    seenLink.add(it.link);

    const status = extractStatusFromText(it.cardText);
    const price = pickFirstPrice(it.priceText ?? it.cardText) ?? "—";
    const days = pickDaysFromText(it.cardText);

    const region = String(
      canonicalTourRegion({
        title: it.title,
        destination: "—",
        region: "—",
      })
    );

    kept.push({
      agency: AGENCY,
      type: TYPE,
      title: it.title,
      destination: "—",
      region,
      days,
      price_range: price,
      departure_date_statuses: [
        { date: toDisplayDate(parsed), status },
      ],
      features: [],
      affiliate_links: { wingon: it.link },
      image_url: it.imageUrl ?? null,
    });
  }

  if (kept.length === 0 && rawItems.length > 0) {
    const samples = rawItems.slice(0, 5).map((x) => {
      const cand = x.dateCandidates?.[0] ?? null;
      const dt = cand ? parseCandidateDate(cand) : null;
      return {
        title: x.title,
        link: x.link,
        dateCandidates: x.dateCandidates,
        parsedFirst: dt ? dt.toISOString().slice(0, 10) : null,
      };
    });
    console.log("debug: 0 筆時的解析樣本（看日期長什麼樣）=", samples);
  }

  await browser.close();

  writeFileSync(OUT_FILE, JSON.stringify(kept, null, 2), "utf-8");
  console.log(
    `抓取完成：page 1 共解析候選 ${rawItems.length}；符合「2016/12 前」共 ${kept.length} 筆。`
  );
  console.log(`輸出檔案：${OUT_FILE}`);
  if (kept.length > 0) {
    console.log(
      "前 5 筆：",
      kept.slice(0, 5).map((x) => `${x.title} (${x.departure_date_statuses[0]?.date})`).join(" | ")
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

