/**
 * EGL 新版「長線」列表：直接打官網 search API（與頁面相同資料來源）
 *
 * POST https://www.egltours.com/website-api/api/web-routes/search
 *
 * 執行：npx tsx scripts/scrape-egl-tour-line-api.ts
 * 輸出：scripts/output/tours-egl-tour-line.json
 *
 * 環境變數（可選）：
 *   EGL_PAGE_SIZE=50   每頁筆數（預設 50）
 *   EGL_MAX_PAGES=40   最多翻幾頁（預設 40，約 2000 筆上限）
 */

import { writeFileSync, mkdirSync } from "fs";
import { resolve } from "path";

const SEARCH_URL = "https://www.egltours.com/website-api/api/web-routes/search";
const OUTPUT_DIR = resolve(process.cwd(), "scripts", "output");
const OUT_FILE = resolve(OUTPUT_DIR, "tours-egl-tour-line.json");

/** 長線分類（與頁面一致，來自網路攔截） */
const LOCATION_LONGHAUL = "70ebb7ddc31011e9bed4bf1b7315466c";
/** 香港出發 */
const DEPARTURE_PLACE_HK = "22e3e7788f0911e3969c001e0b750cd2";

const PAGE_SIZE = Math.min(100, Math.max(10, parseInt(process.env.EGL_PAGE_SIZE || "50", 10) || 50));
const MAX_PAGES = Math.min(200, Math.max(1, parseInt(process.env.EGL_MAX_PAGES || "40", 10) || 40));

interface SearchBody {
  departureDateFrom: null;
  departureDateTo: null;
  dayFrom: null;
  dayTo: null;
  budgetFrom: null;
  budgetTo: null;
  departurePlaceUUID: string;
  keyword: null;
  queryDateTime: null;
  from: number;
  size: number;
  departureMonths: unknown[];
  productCodes: unknown[];
  productTypeCodes: unknown[];
  productLineCodes: unknown[];
  categoryCodes: unknown[];
  labels: unknown[];
  locationUUIDs: string[];
  currency: string;
  empty: boolean;
}

interface TourDateEntry {
  departureDate: string;
  tours?: { code: string; status: string }[];
}

interface ContentItem {
  code: string;
  productCode: string;
  productName: string;
  days: number;
  sellingPrice: number;
  originalPrice: number | null;
  bgImg?: string;
  locations?: { nameZhHk?: string; name?: string }[];
  dates?: TourDateEntry[];
}

interface SearchResponse {
  status: string;
  contents?: ContentItem[];
  from?: number;
  size?: number;
}

/** API status 字母 → 成團顯示（推測，可再對照官網圖例） */
function statusToZh(status: string): "成團" | "快將成團" | "未成團" {
  const s = (status || "").toUpperCase();
  if (s === "A" || s === "O" || s === "AVAILABLE") return "成團";
  if (s === "F" || s === "FULL" || s === "X") return "未成團";
  return "快將成團";
}

function ymdToDDMM(ymd: string): string {
  const p = ymd.split(/[-/]/);
  if (p.length >= 3) {
    const d = p[2].padStart(2, "0");
    const m = p[1].padStart(2, "0");
    return `${d}/${m}`;
  }
  return ymd;
}

function buildDepartureStatuses(dates: TourDateEntry[] | undefined) {
  if (!dates?.length) return [] as { date: string; status: "成團" | "快將成團" | "未成團" }[];
  const out: { date: string; status: "成團" | "快將成團" | "未成團" }[] = [];
  for (const d of dates) {
    const dateStr = ymdToDDMM(d.departureDate);
    const t = d.tours?.[0];
    const st = t ? statusToZh(t.status) : "未成團";
    out.push({ date: dateStr, status: st });
  }
  return out;
}

function regionFromLocations(locations: ContentItem["locations"]): string {
  if (!locations?.length) return "—";
  const names = locations
    .map((l) => (l.nameZhHk || l.name || "").trim())
    .filter((n) => n && n !== "長線");
  return names[0] || "—";
}

async function fetchPage(from: number): Promise<ContentItem[]> {
  const body: SearchBody = {
    departureDateFrom: null,
    departureDateTo: null,
    dayFrom: null,
    dayTo: null,
    budgetFrom: null,
    budgetTo: null,
    departurePlaceUUID: DEPARTURE_PLACE_HK,
    keyword: null,
    queryDateTime: null,
    from,
    size: PAGE_SIZE,
    departureMonths: [],
    productCodes: [],
    productTypeCodes: [],
    productLineCodes: [],
    categoryCodes: [],
    labels: [],
    locationUUIDs: [LOCATION_LONGHAUL],
    currency: "HKD",
    empty: true,
  };

  const res = await fetch(SEARCH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Origin: "https://www.egltours.com",
      Referer: "https://www.egltours.com/website/tour-line/%E9%95%B7%E7%B7%9A",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${await res.text().then((t) => t.slice(0, 200))}`);
  }
  const json = (await res.json()) as SearchResponse;
  if (json.status !== "success" || !Array.isArray(json.contents)) {
    return [];
  }
  return json.contents;
}

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const all: ContentItem[] = [];
  const seen = new Set<string>();

  for (let page = 0; page < MAX_PAGES; page++) {
    const from = page * PAGE_SIZE;
    const contents = await fetchPage(from);
    if (contents.length === 0) break;
    let newCount = 0;
    for (const c of contents) {
      const key = c.code || c.productCode;
      if (!key || seen.has(key)) continue;
      seen.add(key);
      all.push(c);
      newCount++;
    }
    console.log(`第 ${page + 1} 頁 from=${from}：${contents.length} 筆（新增 ${newCount}，累計 ${all.length}）`);
    if (contents.length < PAGE_SIZE) break;
    await new Promise((r) => setTimeout(r, 350));
  }

  const records = all.map((c) => {
    const img = c.bgImg
      ? (c.bgImg.startsWith("http") ? c.bgImg : `https://www.egltours.com${c.bgImg}`)
      : null;
    const link = `https://www.egltours.com/itinerary/tour/${c.code}`;
    const price =
      c.sellingPrice != null
        ? `HK$${Number(c.sellingPrice).toLocaleString("en-HK")}起`
        : "—";
    const departure_date_statuses = buildDepartureStatuses(c.dates);

    return {
      agency: "EGL 東瀛遊",
      type: "longhaul",
      title: c.productName || c.productCode,
      destination: regionFromLocations(c.locations),
      region: regionFromLocations(c.locations),
      days: c.days ?? 0,
      price_range: price,
      departure_date_statuses,
      features: [] as string[],
      affiliate_links: { egl: link },
      image_url: img,
    };
  });

  writeFileSync(OUT_FILE, JSON.stringify(records, null, 2), "utf-8");
  console.log(`\n共 ${records.length} 筆 → ${OUT_FILE}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
