/**
 * 把 OpenClaw（或任何 scraper）抓到的旅行團 JSON 寫入 Supabase public.tour
 *
 * 用法：
 *   npx tsx scripts/push-tours-to-supabase.ts [tours.json]        # 單純 insert
 *   npx tsx scripts/push-tours-to-supabase.ts --upsert [tours.json] # 有則更新、無則新增（每日更新用）
 *
 * 環境變數（可放在專案根目錄 .env.local）：
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY 或 NEXT_PUBLIC_SUPABASE_ANON_KEY
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { normalizeDepartureDateStatusesInput } from "../lib/departureDateStatuses";
import { getSafeHttpUrl } from "../lib/safeExternalUrl";

// 載入專案根目錄 .env.local（若存在）
const envPath = resolve(process.cwd(), ".env.local");
if (existsSync(envPath)) {
  const content = readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
    }
  }
}

const TOUR_TYPES = [
  "longhaul",
  "cruise",
  "cruise_ticket",
  "hiking",
  "diving",
  "festival",
] as const;

type TourType = (typeof TOUR_TYPES)[number];

interface TourRecord {
  agency: string;
  type: TourType;
  title: string;
  destination: string;
  region: string;
  days: number;
  price_range: string;
  departure_date_statuses: { date: string; status: string }[];
  features?: string[];
  affiliate_links?: Record<string, unknown>;
  image_url?: string;
}

/** 寫入 DB 前過濾 affiliate：只保留 http(s) 字串與安全的 others[] */
function sanitizeAffiliateLinksForDb(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object") return {};
  const src = raw as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(src)) {
    if (key === "others" && Array.isArray(val)) {
      const others = val
        .map((item) => {
          if (!item || typeof item !== "object") return null;
          const o = item as { label?: unknown; url?: unknown };
          const url = getSafeHttpUrl(o.url);
          if (!url) return null;
          return { label: String(o.label ?? "").trim() || "連結", url };
        })
        .filter((x): x is { label: string; url: string } => x != null);
      if (others.length > 0) out.others = others;
      continue;
    }
    if (typeof val === "string") {
      const u = getSafeHttpUrl(val);
      if (u) out[key] = u;
    }
  }
  return out;
}

function parseDays(v: unknown): number {
  if (typeof v === "number" && !Number.isNaN(v)) return Math.max(0, Math.floor(v));
  if (typeof v === "string") {
    const n = parseInt(v.replace(/\D/g, ""), 10);
    return Number.isNaN(n) ? 0 : n;
  }
  return 0;
}

function parseStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === "string");
  if (typeof v === "string") return v ? [v.trim()].filter(Boolean) : [];
  return [];
}

function normalizeType(t: unknown): TourType {
  const s = String(t ?? "").toLowerCase().trim();
  if (TOUR_TYPES.includes(s as TourType)) return s as TourType;
  return "longhaul";
}

function slug(s: string): string {
  return s
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[|\n\r]/g, "")
    .slice(0, 200);
}

function normalizeRecord(raw: Record<string, unknown>, defaultAgency: string): TourRecord {
  let departure_date_statuses = normalizeDepartureDateStatusesInput(raw.departure_date_statuses);
  if (departure_date_statuses.length === 0) {
    const datesOnly = parseStringArray(raw.departure_dates);
    departure_date_statuses = datesOnly
      .map((d) => d.trim())
      .filter(Boolean)
      .map((date) => ({ date, status: "未成團" }));
  }
  return {
    agency: (raw.agency as string) ?? defaultAgency,
    type: normalizeType(raw.type),
    title: String(raw.title ?? "").trim() || "未命名行程",
    destination: String(raw.destination ?? "").trim() || "—",
    region: String(raw.region ?? "").trim() || "—",
    days: parseDays(raw.days),
    price_range: String(raw.price_range ?? "").trim() || "—",
    features: parseStringArray(raw.features),
    affiliate_links: sanitizeAffiliateLinksForDb(raw.affiliate_links),
    image_url: getSafeHttpUrl(raw.image_url) ?? undefined,
    departure_date_statuses,
  };
}

function toSourceKey(r: TourRecord): string {
  const links = r.affiliate_links as Record<string, unknown> | undefined;
  if (links && typeof links === "object") {
    const jt = links.jetour;
    if (typeof jt === "string") {
      const m = jt.match(/\/tour\/([A-Za-z0-9]{2,14})\/?$/);
      if (m && !/^(dest|business|promotion)$/i.test(m[1])) return `jetour:${m[1]}`;
    }
    const egl = links.egl;
    if (typeof egl === "string") {
      const m = egl.match(/\/itinerary\/tour\/([^/?]+)/);
      if (m) return `egl:${m[1]}`;
    }
    const gj = links.goldjoy;
    if (typeof gj === "string") {
      const m = gj.match(/[?&]code=([^&]+)/i);
      if (m) return `goldjoy:${decodeURIComponent(m[1])}`;
    }
  }
  return [r.agency, r.title, r.destination, String(r.days)].map(slug).join("|");
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    console.error("缺少 NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_ANON_KEY");
    process.exit(1);
  }

  const defaultAgency = process.env.SCRAPER_AGENCY ?? "未知旅行社";
  const upsert = process.argv.includes("--upsert");
  // 檔案路徑：跳過 node/tsx 與腳本路徑，取非選項的引數
  const fileArg = process.argv.slice(2).find((a) => a !== "--upsert" && !a.startsWith("-"));
  let json: unknown;

  const arg = fileArg;
  if (arg) {
    const filePath = resolve(process.cwd(), arg);
    if (!existsSync(filePath)) {
      console.error("找不到檔案:", filePath);
      process.exit(1);
    }
    const rawJson = readFileSync(filePath, "utf-8").trim();
    if (!rawJson.startsWith("[") && !rawJson.startsWith("{")) {
      console.error("檔案不是有效的 JSON:", filePath);
      process.exit(1);
    }
    json = JSON.parse(rawJson);
  } else {
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
    const raw = Buffer.concat(chunks).toString("utf-8").trim();
    if (!raw) {
      console.error("用法: npx tsx scripts/push-tours-to-supabase.ts [tours.json]");
      console.error("  或: cat tours.json | npx tsx scripts/push-tours-to-supabase.ts");
      process.exit(1);
    }
    json = JSON.parse(raw);
  }

  const list = Array.isArray(json) ? json : [json];
  const rawList = list.map((item) =>
    typeof item === "object" && item !== null ? (item as Record<string, unknown>) : {}
  );
  let records: TourRecord[] = rawList.map((raw) => normalizeRecord(raw, defaultAgency));

  function rowSourceKey(raw: Record<string, unknown>, r: TourRecord): string {
    const sk = raw.source_key;
    if (typeof sk === "string" && sk.trim()) return sk.trim();
    return toSourceKey(r);
  }

  if (upsert) {
    const byKey = new Map<string, TourRecord>();
    const rawByKey = new Map<string, Record<string, unknown>>();
    for (let i = 0; i < records.length; i++) {
      const key = rowSourceKey(rawList[i], records[i]);
      if (!byKey.has(key)) {
        byKey.set(key, records[i]);
        rawByKey.set(key, rawList[i]);
      }
    }
    records = [...byKey.values()];
    const keys = [...byKey.keys()];
    rawList.length = 0;
    keys.forEach((k) => rawList.push(rawByKey.get(k)!));
  }

  const supabase = createClient(url, anonKey);

  const payload = records.map((r, i) => ({
    ...(upsert ? { source_key: rowSourceKey(rawList[i] ?? {}, r) } : {}),
    agency: r.agency,
    type: r.type,
    title: r.title,
    destination: r.destination,
    region: r.region,
    days: r.days,
    price_range: r.price_range,
    departure_date_statuses: r.departure_date_statuses ?? [],
    features: r.features ?? [],
    affiliate_links: r.affiliate_links ?? {},
    image_url: r.image_url ?? null,
  }));

  const { data, error } = upsert
    ? await supabase.from("tour").upsert(payload, { onConflict: "source_key", ignoreDuplicates: false }).select("id")
    : await supabase.from("tour").insert(payload).select("id");

  if (error) {
    console.error("Supabase 錯誤:", error.message);
    if (error.code === "42501") {
      console.error("RLS 不允許寫入，請使用 SUPABASE_SERVICE_ROLE_KEY 或新增 INSERT/UPDATE policy");
    }
    if (error.code === "23505") {
      console.error("唯一鍵衝突：請先執行 migration 003_tour_source_key.sql 新增 source_key 欄位與 unique index");
    }
    process.exit(1);
  }

  console.log(upsert ? `已 upsert ${(data ?? []).length} 筆旅行團` : `已寫入 ${(data ?? []).length} 筆旅行團到 Supabase tour 表`);
}

main();
