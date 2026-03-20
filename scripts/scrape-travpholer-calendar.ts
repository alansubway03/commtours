/**
 * TravPholer 旅行團時間表：依「開始日期」篩選指定年／月，可選進入「行程及報名」詳情頁抓圖與摘要。
 * 頁面多為卡片式（非 table），會從「行程 及 報名」連結向上找單一行程卡再解析。
 *
 * 執行（只列 2026 年 5 月，不開詳情頁）：
 *   npx tsx scripts/scrape-travpholer-calendar.ts
 *
 * 開詳情頁（較慢，抓 og:image、首圖、前段正文）：
 *   set TRAVPHOLER_DETAIL=1 && npx tsx scripts/scrape-travpholer-calendar.ts
 *
 * 環境變數：
 *   TRAVPHOLER_YEAR   預設 2026
 *   TRAVPHOLER_MONTH  預設 5（1–12）
 *   TRAVPHOLER_DETAIL 1 = 造訪每列的詳情連結
 *   TRAVPHOLER_MAX_DETAIL 最多造訪幾個詳情頁（預設不限制，建議測試時設 3）
 */

import { chromium, type Page } from "playwright";
import { writeFileSync, mkdirSync } from "fs";
import { resolve } from "path";

const CALENDAR_URL = "https://travpholer.com/calendar/";
const OUTPUT_DIR = resolve(process.cwd(), "scripts", "output");

const YEAR = Number(process.env.TRAVPHOLER_YEAR || "2026");
const MONTH = Number(process.env.TRAVPHOLER_MONTH || "5");
const WITH_DETAIL = process.env.TRAVPHOLER_DETAIL === "1" || process.env.TRAVPHOLER_DETAIL === "true";
const MAX_DETAIL = process.env.TRAVPHOLER_MAX_DETAIL
  ? Number(process.env.TRAVPHOLER_MAX_DETAIL)
  : Infinity;

const PREFIX = `${YEAR}-${String(MONTH).padStart(2, "0")}`;

export interface TravPholerCalendarRow {
  year: string;
  dateRange: string;
  startDate: string;
  days: string;
  monthCol: string;
  festival: string;
  title: string;
  price: string;
  status: string;
  region: string;
  detailUrl: string | null;
  /** 詳情頁（TRAVPHOLER_DETAIL=1 時填入） */
  detailImageUrl?: string;
  detailOgImage?: string;
  detailTextSnippet?: string;
}

function normalizeCells(raw: string[]): string[] {
  return raw.map((c) => c.replace(/\s+/g, " ").trim());
}

/** 從一列 td 裡找出 YYYY-MM-DD */
function findIsoDate(cells: string[]): string | null {
  for (const c of cells) {
    const m = c.match(/\b(\d{4}-\d{2}-\d{2})\b/);
    if (m) return m[1];
  }
  return null;
}

/**
 * 「行程 及 報名」連結：多數為 travpholer.com 團頁；部分僅 DocSend。
 * 優先站內團頁（圖文較完整），否則用 DocSend。
 */
function pickDetailUrl(links: string[]): string | null {
  const trav: string[] = [];
  const docSend: string[] = [];
  for (const href of links) {
    if (/mailto:|tel:|facebook\.com|instagram\.com|wa\.me/i.test(href)) continue;
    try {
      const u = new URL(href);
      if (u.hostname.includes("travpholer.com") && !/calendar|wp-admin|wp-login/i.test(href)) {
        if (u.pathname && u.pathname !== "/") trav.push(href.split("#")[0]);
      }
      if (u.hostname.includes("docsend.com")) docSend.push(href.split("#")[0]);
    } catch {
      continue;
    }
  }
  return trav[0] ?? docSend[0] ?? null;
}

/** 把一列對應到欄位（依時間表表頭順序推斷） */
function rowToRecord(cells: string[], links: string[]): TravPholerCalendarRow | null {
  const c = normalizeCells(cells);
  if (c.length < 6) return null;
  const iso = findIsoDate(c);
  if (!iso || !iso.startsWith(PREFIX)) return null;

  // 分月標題列常有 "2026年5月" 但沒有合法分散欄位 → iso 已過濾
  const year = c[0] || String(YEAR);
  const dateRange = c[1] || "";
  const startDate = iso;
  const days = c[3] ?? c[2] ?? "";
  const monthCol = c[4] ?? "";
  const festival = c[5] ?? "";
  const title = c[6] ?? "";
  const price = c[7] ?? "";
  const status = c[8] ?? "";
  const region = c[9] ?? "";

  if (!title || title.length < 4) return null;

  return {
    year,
    dateRange,
    startDate,
    days,
    monthCol,
    festival,
    title,
    price,
    status,
    region,
    detailUrl: pickDetailUrl(links),
  };
}

/** 在 Node 端捲動，避免 tsx 在 page.evaluate 內注入 __name 導致 ReferenceError */
async function scrollFullPage(page: Page) {
  for (let round = 0; round < 2; round++) {
    for (let i = 0; i < 55; i++) {
      await page.evaluate(() => {
        window.scrollBy(0, 500);
      });
      await page.waitForTimeout(70);
    }
    if (round === 0) {
      await page.evaluate(() => {
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(300);
    }
  }
}

/**
 * 卡片版時間表：每個「行程 及 報名」→ 向上找「旅行團」只出現 1 次的父層 = 單一行程卡
 */
async function scrapeCardLayout(page: Page): Promise<TravPholerCalendarRow[]> {
  const y = YEAR;
  const m = MONTH;
  const pref = PREFIX;

  const raw = await page.evaluate(
    ({ year, month, prefix }: { year: number; month: number; prefix: string }) => {
      const rows: {
        year: string;
        dateRange: string;
        startDate: string;
        days: string;
        monthCol: string;
        festival: string;
        title: string;
        price: string;
        status: string;
        region: string;
        detailUrl: string;
      }[] = [];
      const seen = new Set<string>();

      const anchors: Element[] = [];
      const allA = document.querySelectorAll("a[href]");
      for (let i = 0; i < allA.length; i++) {
        const a = allA[i];
        const t = (a.textContent || "").replace(/\s+/g, " ");
        if (/行程\s*及\s*報名|行程及報名/.test(t)) anchors.push(a);
      }

      for (const a of anchors) {
        let el: HTMLElement | null = a as HTMLElement;
        let card: HTMLElement | null = null;
        for (let i = 0; i < 28 && el; i++) {
          el = el.parentElement;
          if (!el) break;
          const txt = el.innerText || "";
          const nTour = (txt.match(/旅行團/g) || []).length;
          if (nTour === 1 && (txt.includes("團費") || /\$\s*[\d,，]+/.test(txt))) {
            card = el;
          }
        }
        if (!card) continue;

        const block = (card.innerText || "").replace(/\r\n/g, "\n");
        const dr =
          block.match(/行程日期[\s:：\n]*([^\n]+)/)?.[1]?.trim() ||
          block.match(/(\d{1,2}月\d{1,2}日\s*[-–]\s*\d{1,2}月\d{1,2}日)/)?.[1] ||
          "";

        const rm = dr.match(/(\d{1,2})月(\d{1,2})日/);
        if (!rm) continue;

        let cardYear =
          block.match(/年份[\s:：\n]*(\d{4})/)?.[1] ||
          block.slice(0, 500).match(/\b(20[2-3]\d)\b/)?.[1] ||
          String(year);
        if (cardYear !== String(year)) continue;
        if (Number(rm[1]) !== month) continue;

        const m1 = Number(rm[1]);
        const m2 = Number(rm[2]);
        const startDate =
          year +
          "-" +
          (m1 < 10 ? "0" : "") +
          m1 +
          "-" +
          (m2 < 10 ? "0" : "") +
          m2;
        if (!startDate.startsWith(prefix)) continue;

        const title =
          block.match(/旅行團[\s:：\n]*([^\n]+)/)?.[1]?.trim()?.replace(/\s+/g, " ") || "";
        if (title.length < 2) continue;

        const price =
          block.match(/團費[\s:：\n]*([^\n]+)/)?.[1]?.trim()?.replace(/\s+/g, " ") || "";
        const status =
          block.match(/成團狀態[\s:：\n]*([^\n]+)/)?.[1]?.trim()?.replace(/\s+/g, " ") || "";
        const region =
          block.match(/地區[\s:：\n]*([^\n]+)/)?.[1]?.trim()?.replace(/\s+/g, " ") || "";
        const festival =
          block.match(/節日\s*\/?\s*假期[\s:：\n]*([^\n]*)/)?.[1]?.trim() || "";
        const daysM = title.match(/\((\d+)\s*天\)/);
        let href = ((a as HTMLAnchorElement).href || "").split("#")[0];
        if (!href || href.startsWith("javascript:")) {
          const site = card.querySelector(
            'a[href*="travpholer.com"]:not([href*="calendar"])'
          ) as HTMLAnchorElement | null;
          if (site?.href) href = site.href.split("#")[0];
        }
        if (!href || href.startsWith("javascript:")) {
          const ds = card.querySelector('a[href*="docsend.com"]') as HTMLAnchorElement | null;
          if (ds?.href) href = ds.href.split("#")[0];
        }

        const key = `${startDate}|${title}`;
        if (seen.has(key)) continue;
        seen.add(key);

        rows.push({
          year: cardYear,
          dateRange: dr,
          startDate,
          days: daysM ? daysM[1] : "",
          monthCol: String(month),
          festival,
          title,
          price,
          status,
          region,
          detailUrl: href,
        });
      }
      return rows;
    },
    { year: y, month: m, prefix: pref }
  );

  return raw.map((r) => ({
    ...r,
    detailUrl: normalizeDetailUrl(r.detailUrl),
  }));
}

/** 同一列若還有 travpholer 團頁連結，優先於 button 的 javascript:void */
function normalizeDetailUrl(href: string | null): string | null {
  if (!href || href.startsWith("javascript:")) return null;
  return href;
}

async function scrapeDetailPage(page: Page, url: string) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.keyboard.press("Escape").catch(() => {});
  await page.waitForTimeout(400);

  const ogImage = await page
    .locator('meta[property="og:image"]')
    .getAttribute("content")
    .catch(() => null);

  const firstHero = await page
    .locator("main img[src*='travpholer'], article img[src*='upload'], .entry-content img")
    .first()
    .getAttribute("src")
    .catch(() => null);

  const snippet = await page
    .locator("main, article, .entry-content")
    .first()
    .innerText({ timeout: 8000 })
    .catch(() => "")
    .then((t) => (t || "").replace(/\s+/g, " ").trim().slice(0, 1200));

  const detailImageUrl = firstHero
    ? firstHero.startsWith("http")
      ? firstHero
      : new URL(firstHero, url).href
    : ogImage || undefined;

  return {
    detailOgImage: ogImage || undefined,
    detailImageUrl,
    detailTextSnippet: snippet || undefined,
  };
}

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    locale: "zh-HK",
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });
  const page = await context.newPage();

  console.log(`開啟日曆：${CALENDAR_URL}`);
  await page.goto(CALENDAR_URL, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.keyboard.press("Escape").catch(() => {});
  await scrollFullPage(page);

  const tableData = await page.evaluate(() => {
    const out: { cells: string[]; links: string[] }[] = [];
    const tables = document.querySelectorAll("table");
    for (let ti = 0; ti < tables.length; ti++) {
      const trs = tables[ti].querySelectorAll("tr");
      for (let ri = 0; ri < trs.length; ri++) {
        const tr = trs[ri];
        const tds = tr.querySelectorAll("td, th");
        const cells: string[] = [];
        for (let ci = 0; ci < tds.length; ci++) {
          cells.push(tds[ci].textContent?.replace(/\s+/g, " ").trim() || "");
        }
        const as = tr.querySelectorAll("a[href]");
        const links: string[] = [];
        for (let ai = 0; ai < as.length; ai++) {
          links.push((as[ai] as HTMLAnchorElement).href);
        }
        if (cells.length) out.push({ cells, links });
      }
    }
    return out;
  });

  const seen = new Set<string>();
  const rows: TravPholerCalendarRow[] = [];
  for (const { cells, links } of tableData) {
    const rec = rowToRecord(cells, links);
    if (!rec) continue;
    const key = `${rec.startDate}|${rec.title}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push(rec);
  }

  const cardRows = await scrapeCardLayout(page);
  if (rows.length === 0 && cardRows.length > 0) {
    console.log("已用卡片區塊解析（對應「行程 及 報名」版面）。");
  }
  for (const rec of cardRows) {
    const key = `${rec.startDate}|${rec.title}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push(rec);
  }

  rows.sort((a, b) => a.startDate.localeCompare(b.startDate));
  console.log(`${YEAR} 年 ${MONTH} 月（開始日期 ${PREFIX}-*）：共 ${rows.length} 筆`);

  let detailCount = 0;
  if (WITH_DETAIL && rows.length) {
    const detailPage = await context.newPage();
    for (const r of rows) {
      if (detailCount >= MAX_DETAIL) break;
      if (!r.detailUrl) continue;
      try {
        console.log(`  詳情 [${detailCount + 1}] ${r.detailUrl}`);
        const extra = await scrapeDetailPage(detailPage, r.detailUrl);
        Object.assign(r, extra);
        detailCount++;
        await detailPage.waitForTimeout(500 + Math.random() * 400);
      } catch (e) {
        console.warn(`  略過詳情: ${r.detailUrl}`, (e as Error).message);
      }
    }
    await detailPage.close();
  }

  const outPath = resolve(OUTPUT_DIR, `travpholer-calendar-${YEAR}-${String(MONTH).padStart(2, "0")}.json`);
  writeFileSync(outPath, JSON.stringify(rows, null, 2), "utf-8");
  console.log(`已寫入：${outPath}`);

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
