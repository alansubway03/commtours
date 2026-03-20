/**
 * Jetour 捷旅 旅行團列表 https://www.jetour.com.hk/tour
 * 分頁 ?page=1,2,... 用 Playwright 抓卡片 DOM（與官網篩選列表一致）
 *
 * 執行：npx tsx scripts/scrape-jetour-tours.ts
 * 輸出：scripts/output/tours-jetour.json
 *
 * 環境變數：
 *   JETOUR_MAX_PAGES=25   最多翻頁（預設 25，連續兩頁 0 筆新資料會提前停）
 *   JETOUR_DETAIL=1       逐筆開詳情頁抓具體 DD/MM（再篩成「今天～今年年底」）
 *
 * 列表只有「2025/08 - 2026/09」時：寫一筆 date=整段區間、status=未成團（不拆月份佔位）
 */

import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "fs";
import { resolve } from "path";
import { canonicalTourRegion } from "../lib/canonicalTourRegion";
import { filterDeparturesForDisplay } from "../lib/departureDisplay";

const BASE = "https://www.jetour.com.hk";
const LIST_URL = `${BASE}/tour`;
const OUTPUT_DIR = resolve(process.cwd(), "scripts", "output");
const OUT_FILE = resolve(OUTPUT_DIR, "tours-jetour.json");
const MAX_PAGES = Math.min(80, Math.max(1, parseInt(process.env.JETOUR_MAX_PAGES || "25", 10) || 25));
const DO_DETAIL = process.env.JETOUR_DETAIL === "1" || process.env.JETOUR_DETAIL === "true";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

interface CardRow {
  title: string;
  destination: string;
  days: number;
  price_range: string;
  link: string;
  image_url: string | null;
  departure_note?: string;
}

/** 只掃 main 內行程 article，避免側欄「篩選條件」 */
const EXTRACT_JS = `
(function () {
  var items = [];
  var seen = {};
  function normTourUrl(href) {
    try {
      var u = new URL(href, location.origin);
      if (u.hostname.indexOf("jetour.com.hk") === -1) return null;
      var p = u.pathname.replace(/\\/$/, "");
      if (p.indexOf("/tour/dest/") !== -1) return null;
      var m = p.match(/^\\/tour\\/([A-Za-z0-9]{2,12})$/);
      if (!m) return null;
      var code = m[1];
      if (/^(dest|business|promotion)$/i.test(code)) return null;
      return u.origin + p;
    } catch (e) { return null; }
  }
  function badDest(s) {
    if (!s) return true;
    return /篩選|重置|套用|目的地|主題|成團|出發月份|已選條件|關閉/.test(s);
  }
  var main = document.querySelector("main") || document.body;
  var anchors = main.querySelectorAll('a[href*="/tour/"]');
  for (var i = 0; i < anchors.length; i++) {
    var a = anchors[i];
    var link = normTourUrl(a.getAttribute("href") || a.href);
    if (!link || seen[link]) continue;
    if (a.closest("aside, nav, header, footer, [class*='offcanvas'], [class*='filter']:not([class*='tour'])")) continue;
    var root = a.closest("article") || a.closest("[class*='col-']") || a.closest(".card") || a.closest("li");
    if (!root) root = a.parentElement;
    for (var up = 0; root && up < 6; up++) {
      if (root.querySelector("h5") && /HKD|HK\\$/.test(root.innerText || "")) break;
      root = root.parentElement;
    }
    if (!root || !root.querySelector("h5")) continue;
    var titleEl = root.querySelector("h5") || root.querySelector("h4");
    var title = titleEl ? titleEl.textContent.replace(/\\s+/g, " ").trim() : "";
    if (!title || title.length < 2 || title.length > 220) continue;
    var h6 = root.querySelector("h6");
    var destination = h6 ? h6.textContent.replace(/\\s+/g, " ").trim() : "";
    if (badDest(destination)) destination = "—";
    var text = root.innerText || "";
    var dm = text.match(/(\\d+)\\s*天\\s*([A-Za-z0-9]{2,10})/);
    var days = dm ? parseInt(dm[1], 10) : 0;
    var pm = text.match(/HKD\\s*[\\d,]+\\s*\\+?/i) || text.match(/HK\\$\\s*[\\d,]+/i);
    var price = pm ? pm[0].replace(/\\s+/g, " ").trim() : "";
    var img = root.querySelector("img");
    var src = (img && (img.getAttribute("data-src") || img.src)) || "";
    if (src.indexOf("logo-default") !== -1 || src.indexOf("placeholder") !== -1) src = "";
    if (src && src.indexOf("http") !== 0) { try { src = new URL(src, location.origin).href; } catch (x) { src = ""; } }
    var rangeM = text.match(/20\\d{2}\\/\\d{2}\\s*-\\s*20\\d{2}\\/\\d{2}/);
    seen[link] = true;
    items.push({
      title: title,
      destination: destination || "—",
      days: days,
      price_range: price ? price + "起" : "—",
      link: link,
      image_url: src || null,
      departure_note: rangeM ? rangeM[0] : ""
    });
  }
  return items;
})()
`;

/** 官網僅區間、無具體出發日 → 整段當一列，成團狀態未知 */
function departureFromRangeNote(note: string): { date: string; status: "未成團" }[] {
  const n = String(note ?? "").trim();
  if (!/^\d{4}\/\d{2}\s*-\s*\d{4}\/\d{2}$/.test(n)) return [];
  return [{ date: n, status: "未成團" }];
}

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    args: ["--disable-blink-features=AutomationControlled", "--no-sandbox"],
  });
  const context = await browser.newContext({
    userAgent: UA,
    viewport: { width: 1400, height: 900 },
    locale: "zh-HK",
    extraHTTPHeaders: { "Accept-Language": "zh-HK,zh;q=0.9,en;q=0.8" },
  });
  const page = await context.newPage();
  page.setDefaultTimeout(35000);

  const byLink = new Map<string, CardRow>();
  let emptyStreak = 0;

  await page.goto(LIST_URL, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(4000);

  for (let p = 1; p <= MAX_PAGES; p++) {
    try {
      const rows = (await page.evaluate(EXTRACT_JS)) as CardRow[];
      let newCount = 0;
      for (const r of rows) {
        if (!r.link || byLink.has(r.link)) continue;
        byLink.set(r.link, r);
        newCount++;
      }
      console.log(`第 ${p} 頁：${rows.length} 張卡，新增 ${newCount}，累計 ${byLink.size}`);
      if (newCount === 0) {
        emptyStreak++;
        if (emptyStreak >= 3) break;
      } else emptyStreak = 0;

      const canNext = await page.evaluate(() => {
        const next = document.querySelector(
          'span.page-link[aria-label="Next"]'
        ) as HTMLElement | null;
        return !!(next && !next.classList.contains("disabled"));
      });
      if (!canNext) break;

      await page.click('span.page-link[aria-label="Next"]');
      await page.waitForTimeout(5500);
    } catch (e) {
      console.warn(`第 ${p} 頁失敗:`, (e as Error).message);
      emptyStreak++;
      if (emptyStreak >= 3) break;
    }
  }

  if (DO_DETAIL && byLink.size > 0) {
    let i = 0;
    for (const row of byLink.values()) {
      i++;
      try {
        await page.goto(row.link, { waitUntil: "domcontentloaded", timeout: 20000 });
        await page.waitForTimeout(1500);
        const t = await page.evaluate(() => document.body?.innerText?.slice(0, 8000) ?? "");
        const dates: { date: string; status: "成團" | "快將成團" | "未成團" }[] = [];
        const re = /(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/g;
        let m: RegExpExecArray | null;
        const seen = new Set<string>();
        while ((m = re.exec(t)) !== null) {
          const d = m[1].padStart(2, "0");
          const mo = m[2].padStart(2, "0");
          const mi = parseInt(mo, 10);
          if (mi < 1 || mi > 12) continue;
          const key = d + "/" + mo;
          if (seen.has(key)) continue;
          seen.add(key);
          const before = t.slice(Math.max(0, m.index - 80), m.index);
          let status: "成團" | "快將成團" | "未成團" = "未成團";
          if (/已成團|尚餘少量|額滿/.test(before)) status = "成團";
          else if (/快將成團|收客中/.test(before)) status = "快將成團";
          dates.push({ date: key, status });
          if (dates.length > 48) break;
        }
        if (dates.length > 0) {
          const filtered = filterDeparturesForDisplay(dates);
          if (filtered.length > 0)
            (row as CardRow & { _dates?: typeof dates })._dates = filtered;
        }
      } catch {
        /* skip */
      }
      if (i % 20 === 0) console.log(`詳情進度 ${i}/${byLink.size}`);
    }
  }

  await browser.close();

  const records = [...byLink.values()].map((r) => {
    const ext = r as CardRow & { _dates?: { date: string; status: "成團" | "快將成團" | "未成團" }[] };
    let departure_date_statuses =
      ext._dates && ext._dates.length > 0
        ? ext._dates
        : departureFromRangeNote(r.departure_note || "");
    const region = String(
      canonicalTourRegion({
        title: r.title,
        destination: r.destination,
        region: "—",
      })
    );
    return {
      agency: "Jetour 捷旅",
      type: "longhaul",
      title: r.title,
      destination: r.destination,
      region,
      days: r.days,
      price_range: r.price_range,
      departure_date_statuses,
      features: [] as string[],
      affiliate_links: { jetour: r.link },
      image_url: r.image_url,
    };
  });

  writeFileSync(OUT_FILE, JSON.stringify(records, null, 2), "utf-8");
  console.log(`\n共 ${records.length} 筆 → ${OUT_FILE}`);
  console.log("寫入 DB：npx tsx scripts/push-tours-to-supabase.ts --upsert scripts/output/tours-jetour.json");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
