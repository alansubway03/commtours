/**
 * DeWonder 旅行團抓取（首頁 trip cards）
 *
 * 用法：
 *   npx tsx scripts/scrape-dewonder-tours.ts
 *
 * 輸出：
 *   scripts/output/tours-dewonder.json
 */

import { mkdirSync, writeFileSync } from "fs";
import { resolve } from "path";
import { canonicalTourRegion } from "../lib/canonicalTourRegion";

const SOURCE_URL = "https://dewonder.travel/";
const OUTPUT_DIR = resolve(process.cwd(), "scripts", "output");
const OUT_FILE = resolve(OUTPUT_DIR, "tours-dewonder.json");

type TourStatus = "成團" | "快將成團" | "未成團";

interface TourRow {
  source_key: string;
  agency: string;
  type: "longhaul";
  title: string;
  destination: string;
  region: string;
  days: number;
  price_range: string;
  departure_date_statuses: { date: string; status: TourStatus }[];
  features: string[];
  affiliate_links: { dewonder: string };
  image_url?: string;
}

function decodeHtml(s: string): string {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#8211;|&ndash;/g, "-")
    .replace(/&#8212;|&mdash;/g, "-");
}

function stripTags(s: string): string {
  return decodeHtml(s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function mapStatus(raw: string): TourStatus {
  const s = stripTags(raw);
  if (s.includes("確認出發")) return "成團";
  if (s.includes("快將成團")) return "快將成團";
  return "未成團";
}

function inferDestination(title: string): string {
  const t = title.replace(/\s+/g, "");
  const keys = [
    "不丹",
    "中亞",
    "土庫曼",
    "烏茲別克",
    "西藏",
    "蒙古",
    "南極",
    "北極",
    "格陵蘭",
    "埃及",
    "摩洛哥",
    "高加索",
    "巴爾幹",
    "伊拉克",
    "冰島",
  ];
  const hits = keys.filter((k) => t.includes(k));
  if (hits.length === 0) return "—";
  return [...new Set(hits)].join("、");
}

function inferRegionFromToken(tokenRaw: string): string {
  const token = tokenRaw.toLowerCase();
  if (/(arctic|antarctica|polar)/.test(token)) return "極地";
  if (/(africa|egypt|morocco)/.test(token)) return "非洲";
  if (/(europe|balkans|caucasus)/.test(token)) return "歐洲";
  if (/(iraq|middle-east)/.test(token)) return "中東";
  if (/(bhutan|asia|central-asia|tibet|mongolia)/.test(token)) return "亞洲";
  return "—";
}

function buildSourceKey(link: string, title: string, dateRange: string): string {
  const m = link.match(/\/trip\/([^/?#]+)/i);
  if (m?.[1]) return `dewonder:${m[1]}`;
  const compact = `${title}|${dateRange}`.replace(/\s+/g, " ").trim();
  return `dewonder:${compact}`;
}

function extractFirst(pattern: RegExp, text: string): string {
  const m = text.match(pattern);
  return m?.[1] ? stripTags(m[1]) : "";
}

function parseCards(html: string): TourRow[] {
  const blocks = html.match(/<div class="trip-card"[\s\S]*?<\/a>\s*<\/div>/g) ?? [];
  const out: TourRow[] = [];
  const seen = new Set<string>();

  for (const b of blocks) {
    const link = extractFirst(/<a href="([^"]+)"/i, b);
    if (!link || seen.has(link)) continue;

    const title = extractFirst(/<h3 class="trip-title">([\s\S]*?)<\/h3>/i, b);
    if (!title) continue;

    const dateRange = extractFirst(/<p class="trip-dates">\s*([\s\S]*?)<\/p>/i, b);
    const duration = extractFirst(/<p class="trip-duration">([\s\S]*?)<\/p>/i, b);
    const festival = extractFirst(/<p class="trip-festivals">([\s\S]*?)<\/p>/i, b);
    const imageUrl = extractFirst(/<img[^>]+src="([^"]+)"/i, b);
    const rawStatus = extractFirst(/trip-status-label[^>]*>([\s\S]*?)<\/div>/i, b);
    const regionTokenRaw = extractFirst(/<div class="trip-card"[^>]*data-regions="([^"]*)"/i, b);

    const days =
      Number((duration.match(/(\d+)\s*日/) ?? title.match(/(\d+)\s*日/))?.[1] ?? "0") || 0;
    const destination = inferDestination(title);
    const inferredRegion = inferRegionFromToken(regionTokenRaw.split(",")[0] ?? "");
    const region = String(canonicalTourRegion({ title, destination, region: inferredRegion }));
    const status = mapStatus(rawStatus);

    const row: TourRow = {
      source_key: buildSourceKey(link, title, dateRange),
      agency: "DeWonder",
      type: "longhaul",
      title,
      destination,
      region,
      days,
      price_range: "—",
      departure_date_statuses: dateRange ? [{ date: dateRange, status }] : [],
      features: festival ? [festival] : [],
      affiliate_links: { dewonder: link },
      image_url: imageUrl || undefined,
    };

    out.push(row);
    seen.add(link);
  }
  return out;
}

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const res = await fetch(SOURCE_URL, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "accept-language": "zh-HK,zh;q=0.9,en;q=0.8",
    },
  });
  if (!res.ok) {
    throw new Error(`抓取失敗：${res.status} ${res.statusText}`);
  }

  const html = await res.text();
  const tours = parseCards(html);
  if (tours.length === 0) {
    throw new Error("未解析到任何旅行團，請檢查網站 HTML 結構是否變更");
  }

  writeFileSync(OUT_FILE, JSON.stringify(tours, null, 2), "utf-8");
  console.log(`已輸出 ${tours.length} 筆：${OUT_FILE}`);
  console.log(`下一步：npx tsx scripts/push-tours-to-supabase.ts --upsert ${OUT_FILE}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

