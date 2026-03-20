/**
 * 金怡假期 — 只爬「已成團」，一團號一筆，多個出發日寫在 departure_date_statuses
 * https://www.goldjoy.com/tour/status → #gd-panel
 *
 * 執行：npm run scrape:goldjoy-formed
 * 輸出：scripts/output/tours-goldjoy-formed.json
 *
 *   GOLDJOY_MIN_DAYS=7   僅保留標題可辨識天數且 ≥7（預設 0＝全抓）
 *   GOLDJOY_SKIP_IMAGES=1  不造訪詳情頁取圖（快；image_url 會是 null）
 */

import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "fs";
import { resolve } from "path";
import { canonicalTourRegion } from "../lib/canonicalTourRegion";

const STATUS_URL = "https://www.goldjoy.com/tour/status";
const BASE = "https://www.goldjoy.com";
const OUTPUT_DIR = resolve(process.cwd(), "scripts", "output");
const OUT_FILE = resolve(OUTPUT_DIR, "tours-goldjoy-formed.json");
const MIN_DAYS = Math.max(
  0,
  parseInt(process.env.GOLDJOY_MIN_DAYS ?? "0", 10) || 0
);
const SKIP_IMAGES = process.env.GOLDJOY_SKIP_IMAGES === "1";

async function scrapeTourImage(
  page: import("playwright").Page,
  code: string
): Promise<string | null> {
  const url = `${BASE}/tour?code=${encodeURIComponent(code)}`;
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(2000);
    return await page.evaluate(() => {
      const og = document.querySelector(
        'meta[property="og:image"]'
      ) as HTMLMetaElement | null;
      const c = og?.content?.trim();
      if (c) {
        try {
          return new URL(c, location.origin).href;
        } catch {
          return c.startsWith("http") ? c : null;
        }
      }
      const sel =
        'img[src*="upload"], .swiper-slide img, [class*="banner"] img, main img[src]';
      const imgs = Array.from(
        document.querySelectorAll(sel)
      ) as HTMLImageElement[];
      for (const im of imgs) {
        const s = (im.getAttribute("src") || "").trim();
        if (!s || /logo|icon|avatar|favicon/i.test(s)) continue;
        if (s.length < 15) continue;
        try {
          const abs = new URL(s, location.origin).href;
          if (/\.(jpe?g|png|webp)(\?|$)/i.test(abs)) return abs;
        } catch {
          /* skip */
        }
      }
      return null;
    });
  } catch {
    return null;
  }
}

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const EXTRACT_ROWS_JS = `
(function () {
  var MONTHS = { Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11 };
  function parseDate(s) {
    s = (s || "").trim();
    var m = s.match(/^(\\d+)\\s+(\\w+)\\s+(\\d+)$/);
    if (!m) return { label: s.trim() || "—", key: "0" };
    var mon = MONTHS[m[2]];
    if (mon == null) return { label: s.trim(), key: "0" };
    var y = parseInt(m[3], 10);
    if (y < 100) y += 2000;
    var d = parseInt(m[1], 10);
    var key = y * 10000 + (mon + 1) * 100 + d;
    return { label: s.trim(), key: String(key) };
  }
  function parseDays(t) {
    var m = t.match(/(\\d+)\\s*天/);
    if (m) return parseInt(m[1], 10);
    m = t.match(/(\\d+)\\s*Day/i);
    return m ? parseInt(m[1], 10) : 0;
  }
  var panel = document.querySelector("#gd-panel");
  if (!panel) return [];
  var out = [];
  var grids = panel.querySelectorAll("#gd .mdl-grid");
  for (var i = 0; i < grids.length; i++) {
    var grid = grids[i];
    var dateCell = grid.querySelector(".tour-status-date");
    if (!dateCell) continue;
    var dateInfo = parseDate(dateCell.textContent || "");
    var a = grid.querySelector('a[href*="tour?code="], a[href*="/tour?code="]');
    if (!a) continue;
    var href = a.getAttribute("href") || "";
    var cm = href.match(/[?&]code=([^&]+)/i);
    if (!cm) continue;
    var code = decodeURIComponent(cm[1]).trim();
    if (!code) continue;
    var title = (a.textContent || "").replace(/\\s+/g, " ").trim();
    title = title.replace(/\\s*-\\s*[A-Za-z0-9]+\\s*$/i, "").trim();
    var sp = a.querySelector(".tour-status-code");
    if (sp) title = title.replace(sp.textContent, "").replace(/\\s*-\\s*$/,"").trim();
    var priceEl = grid.querySelector(".tour-status-price");
    var price = priceEl ? priceEl.textContent.replace(/\\s+/g, "").trim() : "";
    var days = parseDays(title);
    out.push({
      code: code,
      title: title,
      days: days,
      price: price,
      dateLabel: dateInfo.label,
      dateKey: dateInfo.key
    });
  }
  return out;
})()
`;

type RowRaw = {
  code: string;
  title: string;
  days: number;
  price: string;
  dateLabel: string;
  dateKey: string;
};

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    args: ["--disable-blink-features=AutomationControlled", "--no-sandbox"],
  });
  const context = await browser.newContext({
    userAgent: UA,
    viewport: { width: 1400, height: 1000 },
    locale: "zh-HK",
  });
  const page = await context.newPage();
  page.setDefaultTimeout(60000);

  await page.goto(STATUS_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(4000);
  await page.locator('a[href="#gd-panel"]').first().click().catch(() => {});
  await page.waitForTimeout(3500);

  const gd = page.locator("#gd-panel #gd").first();
  for (let s = 0; s < 25; s++) {
    await gd
      .evaluate((el: HTMLElement) => {
        el.scrollTop = el.scrollHeight;
      })
      .catch(() => {});
    await page.waitForTimeout(400);
  }

  const rows = (await page.evaluate(EXTRACT_ROWS_JS)) as RowRaw[];

  const passDays = (d: number) => {
    if (MIN_DAYS <= 0) return true;
    if (d <= 0) return true;
    return d >= MIN_DAYS;
  };

  type Acc = {
    title: string;
    days: number;
    prices: string[];
    byKey: Map<string, string>;
  };

  const byCode = new Map<string, Acc>();
  for (const r of rows) {
    if (!passDays(r.days)) continue;
    if (!byCode.has(r.code)) {
      byCode.set(r.code, {
        title: r.title,
        days: r.days,
        prices: [],
        byKey: new Map(),
      });
    }
    const m = byCode.get(r.code)!;
    if (r.title.length > m.title.length) m.title = r.title;
    if (r.days > m.days) m.days = r.days;
    if (r.price && !m.prices.includes(r.price)) m.prices.push(r.price);
    const sortKey =
      r.dateKey && r.dateKey !== "0" ? r.dateKey : `z${r.dateLabel}`;
    if (r.dateLabel && !m.byKey.has(sortKey)) m.byKey.set(sortKey, r.dateLabel);
  }

  const imageByCode = new Map<string, string | null>();
  if (!SKIP_IMAGES && byCode.size > 0) {
    const codes = [...byCode.keys()];
    console.log(`取封面圖：${codes.length} 個團號…`);
    for (let i = 0; i < codes.length; i++) {
      const code = codes[i];
      const img = await scrapeTourImage(page, code);
      imageByCode.set(code, img);
      if (img) console.log(`  [${i + 1}/${codes.length}] ${code} OK`);
      else console.log(`  [${i + 1}/${codes.length}] ${code} (無圖)`);
      await page.waitForTimeout(400);
    }
  }

  await browser.close();

  const records: Record<string, unknown>[] = [];
  for (const [code, v] of byCode) {
    const sortedKeys = [...v.byKey.keys()].sort((a, b) => {
      const na = parseInt(a, 10);
      const nb = parseInt(b, 10);
      if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
      return String(a).localeCompare(String(b));
    });
    let departure_date_statuses = sortedKeys.map((key) => ({
      date: v.byKey.get(key) ?? key,
      status: "成團" as const,
    }));
    if (departure_date_statuses.length === 0) {
      departure_date_statuses = [{ date: "已成團", status: "成團" as const }];
    }
    const nums = v.prices
      .map((p) => parseInt(p.replace(/[$,]/g, ""), 10))
      .filter((n) => !Number.isNaN(n) && n > 0);
    const price_range =
      nums.length > 0
        ? `HK$${Math.min(...nums).toLocaleString("en-HK")}起`
        : "—";
    records.push({
      agency: "金怡假期",
      type: "longhaul",
      title: v.title,
      destination: "—",
      region: String(
        canonicalTourRegion({
          title: v.title,
          destination: "—",
          region: "—",
        })
      ),
      days: v.days || 0,
      price_range,
      departure_date_statuses,
      features: ["已成團"],
      affiliate_links: { goldjoy: `${BASE}/tour?code=${encodeURIComponent(code)}` },
      image_url: imageByCode.get(code) ?? null,
    });
  }

  writeFileSync(OUT_FILE, JSON.stringify(records, null, 2), "utf-8");
  console.log(
    `已成團（一團一筆，共 ${records.length} 團）→ ${OUT_FILE}`
  );
  console.log(`MIN_DAYS=${MIN_DAYS}`);
  console.log(
    "npx tsx scripts/push-tours-to-supabase.ts --upsert scripts/output/tours-goldjoy-formed.json"
  );
  console.log(
    "※ 若先前曾用「每檔一行」push 過，DB 可能留有 goldjoy:團號:日期 的舊 source_key，需自行清理重複列。"
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
