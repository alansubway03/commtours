/**
 * 由 scripts/output/wingon-cruises-ship-rules.json 取出 19 個 detail 連結，
 * 逐一抓詳情頁（title/price/image/departure dates），輸出成 Supabase 可 upsert 的 tours JSON。
 *
 * 產出：
 *   scripts/output/tours-wingon-cruise-selected.json
 *
 * 用法：
 *   npx tsx scripts/build-wingon-cruise-upsert-from-rules.ts
 *   npx tsx scripts/push-tours-to-supabase.ts --upsert scripts/output/tours-wingon-cruise-selected.json
 */

import { chromium } from "playwright";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { canonicalTourRegion } from "../lib/canonicalTourRegion";

const INPUT = resolve(process.cwd(), "scripts", "output", "wingon-cruises-ship-rules.json");
const OUTPUT_DIR = resolve(process.cwd(), "scripts", "output");
const OUT_FILE = resolve(OUTPUT_DIR, "tours-wingon-cruise-selected.json");

const AGENCY = "永安旅遊";
const TYPE = "cruise" as const;

const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function toDisplayDate(d: Date): string {
  const dd = String(d.getDate()).padStart(2, "0");
  const mon = MONTHS_EN[d.getMonth()];
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd} ${mon} ${yy}`;
}

function parseDatesFromText(text: string): Date[] {
  const out: Date[] = [];
  const seen = new Set<number>();
  const t = String(text ?? "");

  // 2026年8月9日
  for (const m of t.matchAll(/(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/g)) {
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const day = Number(m[3]);
    const dt = new Date(y, mo - 1, day);
    const ts = dt.getTime();
    if (!Number.isNaN(ts) && !seen.has(ts)) {
      seen.add(ts);
      out.push(dt);
    }
  }

  // 2026-08-09 / 2026/08/09
  for (const m of t.matchAll(/(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/g)) {
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const day = Number(m[3]);
    const dt = new Date(y, mo - 1, day);
    const ts = dt.getTime();
    if (!Number.isNaN(ts) && !seen.has(ts)) {
      seen.add(ts);
      out.push(dt);
    }
  }

  return out.sort((a, b) => a.getTime() - b.getTime());
}

function parseDaysFromTitle(title: string): number {
  const t = String(title ?? "");
  const m = t.match(/(\d+)\s*天/);
  if (m) return Math.max(0, Number(m[1]));
  return 0;
}

function parsePriceHKD(text: string): string | null {
  const t = String(text ?? "");
  const m = t.match(/HKD\s*([\d,]+)\s*\+?/i) || t.match(/HK\$\s*([\d,]+)\s*\+?/i);
  if (!m) return null;
  return `HK$${m[1].replace(/,/g, ",")}起`;
}

function extractDetailId(url: string): string | null {
  const m = String(url).match(/\/cruises\/detail-(\d+)/i);
  return m ? m[1] : null;
}

// 用字串 evaluate（避免 __name 問題）
const EXTRACT_DETAIL_JS = `
(function () {
  function norm(s) {
    return String(s ?? "").replace(/\\u00A0/g, " ").replace(/\\s+/g, " ").trim();
  }
  const title =
    norm(document.querySelector("h1")?.textContent) ||
    norm(document.querySelector("h2")?.textContent) ||
    norm(document.title);

  const og = document.querySelector("meta[property='og:image']");
  const ogImage = og && og.getAttribute("content") ? og.getAttribute("content").trim() : null;

  const text = norm(document.body ? document.body.textContent : "");

  return { title, ogImage, text };
})()
`;

type RuleProduct = { title: string; link: string };
type WingonRuleSource = {
  allProductsByShip?: Record<string, RuleProduct[]>;
};
type WingonCruiseRecord = {
  source_key: string;
  agency: typeof AGENCY;
  type: typeof TYPE;
  title: string;
  destination: string;
  region: string;
  days: number;
  price_range: string;
  departure_date_statuses: { date: string; status: "未成團" }[];
  features: string[];
  affiliate_links: { wingon: string };
  image_url: string | null;
};

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const src = JSON.parse(readFileSync(INPUT, "utf-8")) as WingonRuleSource;
  const allByShip = (src?.allProductsByShip ?? {}) as Record<string, RuleProduct[]>;
  const links = Object.values(allByShip).flat().map((x) => x.link);

  // 去重保留順序
  const uniq: string[] = [];
  const seen = new Set<string>();
  for (const u of links) {
    if (!u || seen.has(u)) continue;
    seen.add(u);
    uniq.push(u);
  }

  console.log(`將抓取 ${uniq.length} 個 detail 連結。`);

  const browser = await chromium.launch({
    headless: true,
    args: ["--disable-blink-features=AutomationControlled", "--no-sandbox"],
  });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });
  const page = await context.newPage();

  const out: WingonCruiseRecord[] = [];

  for (let i = 0; i < uniq.length; i++) {
    const url = uniq[i]!;
    const id = extractDetailId(url) ?? String(i + 1);
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 120000 });
      await page.waitForTimeout(1200);

      const d = (await page.evaluate(EXTRACT_DETAIL_JS)) as {
        title: string;
        ogImage: string | null;
        text: string;
      };

      const title = d.title || "(無標題)";
      const dates = parseDatesFromText(d.text);
      const dep = dates.slice(0, 30).map((dt) => ({ date: toDisplayDate(dt), status: "未成團" as const }));
      const days = parseDaysFromTitle(title);
      const price_range = parsePriceHKD(d.text) ?? "—";
      const region = String(
        canonicalTourRegion({ title, destination: "—", region: "—" })
      );

      out.push({
        source_key: `wingon-cruise:detail-${id}`,
        agency: AGENCY,
        type: TYPE,
        title,
        destination: "—",
        region,
        days,
        price_range,
        departure_date_statuses: dep,
        features: [],
        affiliate_links: { wingon: url },
        image_url: d.ogImage,
      });
      console.log(`  [${i + 1}/${uniq.length}] OK detail-${id}`);
    } catch {
      console.log(`  [${i + 1}/${uniq.length}] FAIL ${url}`);
      out.push({
        source_key: `wingon-cruise:detail-${id}`,
        agency: AGENCY,
        type: TYPE,
        title: "(抓取失敗)",
        destination: "—",
        region: "—",
        days: 0,
        price_range: "—",
        departure_date_statuses: [],
        features: [],
        affiliate_links: { wingon: url },
        image_url: null,
      });
    }
  }

  await browser.close();

  writeFileSync(OUT_FILE, JSON.stringify(out, null, 2), "utf-8");
  console.log(`完成：輸出 ${OUT_FILE}（共 ${out.length} 筆）`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

