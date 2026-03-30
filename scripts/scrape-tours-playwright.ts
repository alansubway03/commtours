/**
 * 用 Playwright 從五家旅行社各抓約 10 筆旅行團，輸出成 Supabase 可吃的 JSON。
 * 每家網站使用專用 container / title / link / price selector，避免抓到導覽或分類連結。
 *
 * 執行：npx tsx scripts/scrape-tours-playwright.ts
 * 輸出：scripts/output/tours-<旅行社>.json（各約 10 筆）
 */

import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "fs";
import { resolve } from "path";

const OUTPUT_DIR = resolve(process.cwd(), "scripts", "output");
const MAX_PER_SITE = 10;
/** 設為 true 或 env SCRAPE_DETAIL_DATES=1 時，會進入每個行程詳情頁抓取完整出發日期（較慢） */
const SCRAPE_DETAIL_DATES = process.env.SCRAPE_DETAIL_DATES === "1" || process.env.SCRAPE_DETAIL_DATES === "true";

/** 單一 selector 組（傳給 trySel） */
interface SelectorSet {
  container: string;
  titleSel: string;
  linkSel: string;
  priceSel?: string;
  daysSel?: string;
  destSel?: string;
  /** 出發日期區塊（列表卡上） */
  departureSel?: string;
}

/** 每家網站的專用 selectors，依序嘗試直到湊滿 maxCount */
const SITE_SELECTORS: Record<string, SelectorSet[]> = {
  // 永安：長線列表頁可能為產品卡片網格，排除 list/country、list/province 分類連結
  wingon: [
    { container: ".product-item", titleSel: "h3, h2, .title, .product-name", linkSel: "a", priceSel: ".price, .amount", daysSel: ".days, .duration, [class*='day']", departureSel: "[class*='departure'], [class*='date'], .product-item" },
    { container: ".tour-card", titleSel: "h2, h3, .title", linkSel: "a", priceSel: ".price", daysSel: ".days, .duration" },
    { container: "[class*='product']", titleSel: "h2, h3, .title", linkSel: "a", priceSel: "[class*='price']", daysSel: "[class*='day']" },
  ],
  // EGL 東瀛遊：長線列表
  egl: [
    { container: ".tour-item", titleSel: "h2, h3, .title, a", linkSel: "a", priceSel: ".price, .amount" },
    { container: ".tour-card", titleSel: "h2, h3, .title", linkSel: "a", priceSel: ".price" },
    { container: "[class*='tour']", titleSel: "h2, h3, .title, a", linkSel: "a", priceSel: "[class*='price']" },
  ],
  // 金怡：每張卡有 data-stat-tour-code，標題在 h6，詳情連結帶 code=；用父層包住整張卡
  goldjoy: [
    { container: "div:has(> [data-stat-tour-code])", titleSel: "h6", linkSel: "a[href*='tour?code='], a[href*='code=']", priceSel: "[class*='price'], .amount" },
    { container: "[data-stat-tour-code]", titleSel: "h6", linkSel: "a[href*='code=']", priceSel: "[class*='price']" },
  ],
  // Jetour：卡片為 article 或 .card，標題 h4/h5，連結為 /tour/ 但排除 /tour/dest/ 目的地頁
  jetour: [
    { container: "main article", titleSel: "h4, h5, h2, .title", linkSel: "a[href*='/tour/']", priceSel: "[class*='price'], .price" },
    { container: "article", titleSel: "h4, h5, h2", linkSel: "a", priceSel: "[class*='price']" },
    { container: "[class*='TourCard'], [class*='tour-card']", titleSel: "h4, h5, h2", linkSel: "a", priceSel: "[class*='price']" },
  ],
  // 縱橫遊：summary 為關鍵字 landing，改用 search 頁或抓有團號的連結
  wwpkg: [
    { container: ".tour-item", titleSel: "h2, h3, .title, a", linkSel: "a", priceSel: ".price" },
    { container: ".tour-card", titleSel: "h2, h3, .title", linkSel: "a", priceSel: ".price" },
    { container: "[class*='tour']", titleSel: "h2, h3, .title", linkSel: "a", priceSel: "[class*='price']" },
  ],
};

/** 連結必須排除的 regex（避免抓到分類/目的地/導覽連結） */
const LINK_EXCLUDE: Record<string, string> = {
  wingon: "tours/list/|tours/dest/",
  egl: "indexOnline3in1|content\\.html|tourism_office|member\\.|/login|/register|investor|/site/career|/trip-packages|/survey|travel/pages(?!.*showTour)",
  goldjoy: "tour/status|articles/|tour/incentive|/tour/theme|about-us|career|tour\\?searchCriteria|tour\\?region",
  jetour: "/contact|/promotion|/tour/dest/|cruise|/tour$|theme-detail|studytour|bespoke-journey|/seminar",
  wwpkg: "tour/search$|daytour/landing|/info/|populardata|tourinformation|/misc/|/member/",
};

/** 暫不抓取的站（金怡、縱橫遊等），之後可從此陣列移除以恢復 */
const SKIP_SITES = ["goldjoy", "wwpkg"];

/** 若設 urls 則會依序抓取並合併（去重 by link）。若設 maxPerSite 則該站取前 N 筆，否則用 MAX_PER_SITE */
const SITES: { name: string; agency: string; url: string; urls?: string[]; maxPerSite?: number; affiliateKey: string }[] = [
  // 永安：依地區多頁抓長線，不設上限（盡量抓齊長線）
  {
    name: "wingon",
    agency: "永安旅遊",
    url: "https://www.wingontravel.com/promotion/activity/tour-holiday-lh/",
    maxPerSite: 80,
    urls: [
      "https://www.wingontravel.com/promotion/activity/tour-holiday-lh/",
      "https://www.wingontravel.com/tours/country/travel-15", // 澳洲
      "https://www.wingontravel.com/tours/list-category-62", // 長線類別
      "https://www.wingontravel.com/tours/list/label-116.html", // 歐洲熱賣
      "https://www.wingontravel.com/tours/dest/australianewzealandtravel-5-39", // 澳洲|新西蘭
      "https://www.wingontravel.com/tours/dest/westerneuropetravel-5-10", // 西歐|馬爾他|塞浦路斯
      "https://www.wingontravel.com/tours/dest/southerneuropetravel-5-11", // 西葡|北歐|冰島
      "https://www.wingontravel.com/tours/dest/Easterneuropetravel-5-959", // 東歐|巴爾幹
      "https://www.wingontravel.com/tours/dest/mediterraneansiberiamongoliacaucasiavladivostoktravel-5-40", // 地中海|高加索|中亞（含土耳其等）
      "https://www.wingontravel.com/tours/dest/americatravel-5-910", // 美洲|中南美
    ],
    affiliateKey: "wingon",
  },
  { name: "egl", agency: "EGL 東瀛遊", url: "https://www.egltours.com/travel/pages/EGL_travel_tour_LongHaultravel/index.html", affiliateKey: "egl" },
  { name: "goldjoy", agency: "金怡假期", url: "https://www.goldjoy.com/tour", affiliateKey: "goldjoy" },
  { name: "jetour", agency: "Jetour 捷旅", url: "https://www.jetour.com.hk/tour", affiliateKey: "jetour" },
  { name: "wwpkg", agency: "縱橫遊WWPKG", url: "https://www.wwpkg.com.hk/tour/landing?keywords=%E9%95%B7%E7%B7%9A%E7%B2%BE%E9%81%B8", affiliateKey: "wwpkg" },
];

/** 排除東南亞、中國、日本、韓國行程：標題或目的地含這些關鍵字則不保留 */
const EXCLUDE_REGION_KEYWORDS =
  /東南亞|中國|泰國|越南|新加坡|馬來西亞|印尼|菲律賓|柬埔寨|寮國|緬甸|台灣|日本|韓國|東京|大阪|北海道|九州|沖繩|首爾|釜山|北京|上海|廣州|桂林|雲南|成都|九寨溝|杭州|西安|華東|華南|廈門|海南|東北三省|長江三峽|絲路|新疆|西藏|內蒙|哈爾濱|張家界|洛陽|開封|鄭州|中原|廣東|高鐵/i;

function isExcludedRegion(title: string, destination: string): boolean {
  return EXCLUDE_REGION_KEYWORDS.test(title) || EXCLUDE_REGION_KEYWORDS.test(destination);
}

/** 排除非行程項目（條款、導覽、活動卡等） */
const EXCLUDE_TITLE_KEYWORDS =
  /報名及責任細則|條款|細則|須知|免責|私隱|terms|disclaimer|^復活節出發$|^廣東美食$|^賞花之旅$|盲盒.*純玩|^《盲盒|^立即致電|人才招聘|自由行套票|自駕遊|當地玩樂|意見問卷|^已成團推介$|^捷旅學堂$|^北極專頁$|^企業架構$|^旅遊講座$|^私人組團$|^學術交流團$|^會員登入$/i;
function isExcludedTitle(title: string): boolean {
  return EXCLUDE_TITLE_KEYWORDS.test(title || "");
}

interface RawTour {
  title: string;
  link: string;
  price?: string;
  days?: number;
  destination?: string;
  imageUrl?: string;
  departureText?: string;
  departure_dates?: string[];
  /** 每個出發日期對應的成團狀態 */
  departure_date_statuses?: { date: string; status: "成團" | "快將成團" | "未成團" }[];
}

// 在瀏覽器內執行的純 JS（字串形式避免 tsx 編譯注入 __name 等導致 evaluate 報錯）
// 參數: maxCount, siteSelectors (array of {container, titleSel, linkSel, priceSel?, daysSel?, destSel?}), linkExcludeRegex (string or null)
const EXTRACT_TOURS_JS = `
function getMainImageUrl(el) {
  var img = el.querySelector("img");
  if (!img) return undefined;
  var src = (img.getAttribute("data-src") || img.getAttribute("data-lazy") || img.src || "").trim();
  if (!src || src.indexOf("data:") === 0 || src.indexOf("placeholder") !== -1 || src.indexOf("1x1") !== -1) return undefined;
  return src;
}
var results = [];
var seen = new Set();
if (typeof siteSelectors === "undefined") siteSelectors = [];
var linkExcludeRegex = linkExclude ? new RegExp(linkExclude) : null;
function hrefExcluded(href) {
  if (!linkExcludeRegex || !href) return false;
  return linkExcludeRegex.test(href);
}
function trySel(container, titleSel, linkSel, priceSel, daysSel, destSel, departureSel) {
  if (!container) return;
  linkSel = linkSel || "a";
  var containers = document.querySelectorAll(container);
  for (var i = 0; i < containers.length && results.length < maxCount; i++) {
    var el = containers[i];
    var titleEl = titleSel ? el.querySelector(titleSel) : null;
    var title = titleEl ? titleEl.textContent.trim() : "";
    var linkEl = el.querySelector(linkSel);
    var href = linkEl ? (linkEl.href || (linkEl.querySelector("a") && linkEl.querySelector("a").href)) : "";
    if (!title || !href || seen.has(href) || hrefExcluded(href)) continue;
    if (title.length < 4 || title.length > 600) continue;
    seen.add(href);
    var priceEl = priceSel ? el.querySelector(priceSel) : null;
    var daysEl = daysSel ? el.querySelector(daysSel) : null;
    var destEl = destSel ? el.querySelector(destSel) : null;
    var depEl = departureSel ? el.querySelector(departureSel) : null;
    var departureText = depEl ? depEl.textContent.trim() : "";
    var imageUrl = getMainImageUrl(el);
    var days;
    if (daysEl) { var t = (daysEl.textContent || "").replace(/\\D/g, ""); days = t ? parseInt(t, 10) : undefined; }
    results.push({ title: title, link: href, price: priceEl ? priceEl.textContent.trim() : undefined, days: days, destination: destEl ? destEl.textContent.trim() : undefined, imageUrl: imageUrl, departureText: departureText });
  }
}
var idx;
if (siteSelectors.length > 0) {
  for (idx = 0; idx < siteSelectors.length && results.length < maxCount; idx++) {
    var s = siteSelectors[idx];
    trySel(s.container, s.titleSel, s.linkSel, s.priceSel || null, s.daysSel || null, s.destSel || null, s.departureSel || null);
  }
}
if (results.length < maxCount) {
  trySel(".tour-card", "h2, h3, .title, .tour-title, [data-title]", "a", ".price, .amount", ".days, .duration", ".destination", null);
  trySel(".product-card", "h2, h3, .title, .product-title", "a", ".price, .amount", ".days, .duration", null, null);
  trySel(".tour-item", "h2, h3, .title, a", "a", ".price", ".days", ".destination", null);
  trySel("[data-tour-id]", "[data-title], h2, h3, .title", "a", ".price", ".days", null, null);
  trySel("article", "h2, h3, .title", "a", ".price", ".days", null, null);
  trySel(".list-item", "a", "a", ".price", ".days", null, null);
}
if (results.length < maxCount) {
  var links = document.querySelectorAll('a[href*="tour"], a[href*="product"], a[href*="detail"]');
  for (var j = 0; j < links.length && results.length < maxCount; j++) {
    var a = links[j];
    var href = a.href;
    var title = a.textContent ? a.textContent.trim() : "";
    if (!title || title.length < 4 || title.length > 150 || seen.has(href) || hrefExcluded(href)) continue;
    seen.add(href);
    var card = a.closest("li, .card, .item, article, [class*='product'], [class*='tour']") || a.parentElement;
    var imageUrl = card ? getMainImageUrl(card) : undefined;
    results.push({ title: title, link: href, imageUrl: imageUrl, departureText: "" });
  }
}
return results.slice(0, maxCount);
`;

/** 是否為合理 DD/MM（月份 01–12，日 01–31） */
function isValidDDMM(d: string, mo: string): boolean {
  const di = parseInt(d, 10);
  const mi = parseInt(mo, 10);
  return mi >= 1 && mi <= 12 && di >= 1 && di <= 31;
}

type DepartureDateStatus = "成團" | "快將成團" | "未成團";

/** 依日期在文字中的位置，判斷該日期前最近一個關鍵字以決定成團狀態 */
function getStatusBeforeDate(text: string, dateEndIndex: number): DepartureDateStatus {
  const before = text.slice(0, dateEndIndex);
  const lastFormed = Math.max(before.lastIndexOf("已成團"), before.lastIndexOf("已滿"));
  const lastAlmost = before.lastIndexOf("快將成團");
  const lastOther = before.lastIndexOf("其他日期");
  const idx = Math.max(lastFormed, lastAlmost, lastOther);
  if (idx < 0) return "未成團";
  if (idx === lastAlmost) return "快將成團";
  if (idx === lastFormed) return "成團";
  return "未成團";
}

/** 解析出發日期並附上每個日期的成團狀態（成團/快將成團/未成團） */
function parseDepartureDateStatusesFromText(text: string): { date: string; status: DepartureDateStatus }[] {
  if (!text || !text.trim()) return [];
  const out: { date: string; status: DepartureDateStatus }[] = [];
  const seen = new Set<string>();

  function add(d: string, mo: string, endIndex: number) {
    if (!isValidDDMM(d, mo)) return;
    const dateStr = `${d}/${mo}`;
    if (seen.has(dateStr)) return;
    seen.add(dateStr);
    out.push({ date: dateStr, status: getStatusBeforeDate(text, endIndex) });
  }

  // DD/MM 或 DD/MM/YY
  const re1 = /\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?(?=[^\d/]|$)/g;
  let m: RegExpExecArray | null;
  while ((m = re1.exec(text)) !== null) {
    add(m[1].padStart(2, "0"), m[2].padStart(2, "0"), m.index);
  }
  // 日期後緊接數字
  const re1b = /(\d{1,2})\/(\d{1,2})(?=\d)/g;
  while ((m = re1b.exec(text)) !== null) {
    add(m[1].padStart(2, "0"), m[2].padStart(2, "0"), m.index);
  }
  return out;
}

/** 從文字中解析出發日期（僅日期陣列，相容用） */
function parseDepartureDatesFromText(text: string): string[] {
  return parseDepartureDateStatusesFromText(text).map((x) => x.date);
}

/** 從標題解析天數（例如 "7天花見"、"5天之旅"）與目的地（首個 X天 前的地區名） */
function parseTitleForDaysAndDest(title: string): { days: number; destination: string } {
  let days = 0;
  let destination = "";
  const daysMatch = title.match(/(\d+)\s*天/);
  if (daysMatch) days = parseInt(daysMatch[1], 10);
  const beforeDays = title.split(/\d+\s*天/)[0] || "";
  const destMatch = beforeDays.match(/([\u4e00-\u9fff、·\s]+)$/);
  if (destMatch) {
    destination = destMatch[1]
      .replace(/\d*精選/g, "")
      .replace(/^[\s\u3000、]+|[\s\u3000]+$/g, "")
      .trim();
    if (destination.length > 60) destination = destination.slice(0, 60);
  }
  return { days, destination };
}

/** 後處理：若缺少 days/destination/price 則從標題或預設補齊；合併出發日期與每日期狀態 */
function enrichRaw(raw: RawTour): RawTour {
  const { days: parsedDays, destination: parsedDest } = parseTitleForDaysAndDest(raw.title || "");
  if ((raw.days == null || raw.days === 0) && parsedDays > 0) raw.days = parsedDays;
  if ((!raw.destination || raw.destination === "—") && parsedDest) raw.destination = parsedDest;
  const fromTitle = parseDepartureDateStatusesFromText(raw.title || "");
  const fromBlock = parseDepartureDateStatusesFromText(raw.departureText || "");
  const byDate = new Map<string, "成團" | "快將成團" | "未成團">();
  for (const x of [...fromBlock, ...fromTitle]) byDate.set(x.date, x.status);
  raw.departure_date_statuses = [...byDate.entries()].map(([date, status]) => ({ date, status }));
  raw.departure_dates = raw.departure_date_statuses.map((x) => x.date);
  return raw;
}

/** 從標題判斷成團狀態：常見「已成團」「快將成團」等 */
function getFormationStatus(title: string): "成團" | "未成團" {
  if (!title) return "未成團";
  return /已成團|已滿|成團/.test(title) ? "成團" : "未成團";
}

// 轉成我們 DB 的格式
function toTourRecord(raw: RawTour, agency: string, affiliateKey: string): Record<string, unknown> {
  const links: Record<string, string> = {};
  links[affiliateKey] = raw.link;
  return {
    agency,
    type: "longhaul",
    title: raw.title || "未命名行程",
    destination: raw.destination || "—",
    region: "亞洲",
    days: raw.days ?? 0,
    price_range: raw.price || "—",
    departure_dates: raw.departure_dates ?? [],
    departure_date_statuses: raw.departure_date_statuses ?? [],
    features: [],
    affiliate_links: links,
    image_url: raw.imageUrl || null,
    成團狀態: getFormationStatus(raw.title || ""),
  };
}

/** 模擬一般瀏覽器，減低 403 / reCAPTCHA 觸發（尤其 EGL 等） */
const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const BROWSER_VIEWPORT = { width: 1280, height: 720 };

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    args: ["--disable-blink-features=AutomationControlled", "--no-sandbox"],
  });

  for (const site of SITES) {
    if (SKIP_SITES.includes(site.name)) {
      console.log(`[${site.agency}] 已略過（SKIP_SITES）`);
      continue;
    }
    const context = await browser.newContext({
      userAgent: BROWSER_USER_AGENT,
      viewport: BROWSER_VIEWPORT,
      locale: "zh-HK",
      extraHTTPHeaders: { "Accept-Language": "zh-HK,zh;q=0.9,en;q=0.8" },
    });
    const page = await context.newPage();
    page.setDefaultTimeout(25000);
    const siteSelectors = SITE_SELECTORS[site.name] || [];
    const linkExclude = LINK_EXCLUDE[site.name] || null;
    const urlsToFetch = site.urls && site.urls.length > 0 ? site.urls : [site.url];
    const allRaws: RawTour[] = [];
    const seenLinks = new Set<string>();

    try {
      for (const u of urlsToFetch) {
        try {
          await page.goto(u, { waitUntil: "domcontentloaded", timeout: 30000 });
          await page.waitForTimeout(4000);
          const raws = (await page.evaluate(
            (
              { body, maxCount, siteSelectors, linkExclude }: {
                body: string;
                maxCount: number;
                siteSelectors: SelectorSet[];
                linkExclude: string | null;
              }
            ) => (new Function("maxCount", "siteSelectors", "linkExclude", body))(maxCount, siteSelectors, linkExclude),
            { body: EXTRACT_TOURS_JS, maxCount: urlsToFetch.length > 3 ? 60 : Math.max(MAX_PER_SITE * 3, 30), siteSelectors, linkExclude }
          )) as RawTour[];
          for (const r of raws) {
            const norm = (r.link || "").trim();
            if (norm && !seenLinks.has(norm)) {
              seenLinks.add(norm);
              allRaws.push(r);
            }
          }
        } catch {
          console.warn(`[${site.agency}] 略過 (逾時或失敗): ${u}`);
        }
      }

      const enriched = allRaws.map((r) => enrichRaw(r));
      const filtered = enriched.filter(
        (r) =>
          !isExcludedRegion(r.title || "", r.destination || "") &&
          !isExcludedTitle(r.title || "")
      );
      const cap = site.maxPerSite ?? MAX_PER_SITE;
      const capped = filtered.slice(0, cap);

      if (SCRAPE_DETAIL_DATES && capped.length > 0) {
        for (let i = 0; i < capped.length; i++) {
          const raw = capped[i];
          try {
            await page.goto(raw.link, { waitUntil: "domcontentloaded", timeout: 15000 });
            await page.waitForTimeout(2000);
            const pageText = await page.evaluate(() => document.body?.innerText ?? "");
            const moreDates = parseDepartureDatesFromText(pageText);
            raw.departure_dates = [...new Set([...(raw.departure_dates ?? []), ...moreDates])];
          } catch {
            // 單一詳情頁失敗不影響其餘
          }
        }
      }

      const records = capped.map((r) => toTourRecord(r, site.agency, site.affiliateKey));
      const outPath = resolve(OUTPUT_DIR, `tours-${site.name}.json`);
      writeFileSync(outPath, JSON.stringify(records, null, 2), "utf-8");
      console.log(`[${site.agency}] 寫入 ${records.length} 筆 → ${outPath}`);
    } catch (e) {
      console.error(`[${site.agency}] 抓取失敗:`, e);
    } finally {
      await context.close();
    }
  }

  await browser.close();
  console.log("\n完成。接著可執行：npx tsx scripts/push-tours-to-supabase.ts scripts/output/tours-<name>.json");
}

main();
