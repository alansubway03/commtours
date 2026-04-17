/**
 * 從 CSV 讀取旅行團並 upsert 到 Supabase public.tour
 *
 * 第 1 列須為欄位名（與範本一致）。
 *
 * 用法：
 *   npx tsx scripts/upload-tours-from-excel.ts path/to/檔案.csv
 *   npx tsx scripts/upload-tours-from-excel.ts --dry-run path/to/檔案.csv
 *
 * 環境變數：與 push-tours-to-supabase 相同（.env.local）
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { normalizeDepartureDateStatusesInput } from "../lib/departureDateStatuses";
import { getSafeHttpUrl } from "../lib/safeExternalUrl";

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

const TYPE_MAP: Record<string, TourType> = {
  longhaul: "longhaul",
  長線團: "longhaul",
  長線: "longhaul",
  cruise: "cruise",
  郵輪團: "cruise",
  cruise_ticket: "cruise_ticket",
  郵輪船票: "cruise_ticket",
  hiking: "hiking",
  行山: "hiking",
  diving: "diving",
  潛水: "diving",
  festival: "festival",
  節日: "festival",
};

function str(v: unknown): string {
  if (v == null || v === "") return "";
  if (typeof v === "number" && !Number.isNaN(v)) return String(v);
  return String(v).trim();
}

function parseDays(v: unknown): number {
  if (typeof v === "number" && !Number.isNaN(v)) return Math.max(0, Math.floor(v));
  const s = str(v);
  const n = parseInt(s.replace(/\D/g, ""), 10);
  return Number.isNaN(n) ? 0 : n;
}

function mapType(s: string): TourType {
  const t = s.toLowerCase().trim();
  if (TOUR_TYPES.includes(t as TourType)) return t as TourType;
  return TYPE_MAP[s.trim()] ?? "longhaul";
}

function slug(s: string): string {
  return s
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[|\n\r]/g, "")
    .slice(0, 200);
}

function parseFeatures(cell: string): string[] {
  if (!cell) return [];
  return cell
    .split(/[;；]/)
    .map((x) => x.trim())
    .filter(Boolean);
}

function parseDepartureCell(cell: string) {
  if (!cell) return [];
  const parts = cell.split(/[;\n]/).map((x) => x.trim()).filter(Boolean);
  return normalizeDepartureDateStatusesInput(parts);
}

interface TourRecord {
  agency: string;
  type: TourType;
  title: string;
  destination: string;
  region: string;
  days: number;
  price_range: string;
  departure_date_statuses: { date: string; status: string }[];
  features: string[];
  affiliate_links: { wingon?: string; tripdotcom?: string; others?: { label: string; url: string }[] };
  image_url: string | null;
}

const CSV_HEADERS = [
  "旅行社",
  "團種",
  "行程名稱",
  "目的地",
  "區域",
  "天數",
  "價錢",
  "出發日與成團",
  "特色",
  "連結1名稱",
  "連結1網址",
  "連結2名稱",
  "連結2網址",
  "圖片網址",
] as const;

function parseCsv(content: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    const next = i + 1 < content.length ? content[i + 1] : "";

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ",") {
      row.push(cell.trim());
      cell = "";
      continue;
    }
    if (ch === "\n") {
      row.push(cell.trim());
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }
    if (ch === "\r") {
      continue;
    }
    cell += ch;
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell.trim());
    rows.push(row);
  }

  return rows
    .map((r) => r.map((x) => x.replace(/^\uFEFF/, "")))
    .filter((r) => r.some((x) => x !== ""));
}

function csvRowsToObjects(rows: string[][]): Record<string, unknown>[] {
  if (rows.length === 0) return [];
  const header = rows[0] ?? [];
  const dataRows = rows.slice(1);
  return dataRows.map((r) => {
    const out: Record<string, unknown> = {};
    for (let i = 0; i < header.length; i++) {
      const key = String(header[i] ?? "").trim();
      if (!key) continue;
      out[key] = String(r[i] ?? "").trim();
    }
    return out;
  });
}

function rowToRecord(row: Record<string, unknown>, defaultAgency: string): TourRecord | null {
  const title = str(row["行程名稱"]);
  if (!title) return null;
  // 範本內建範例列，勿上傳
  if (str(row["旅行社"]) === "範例旅行社") return null;

  const agency = str(row["旅行社"]) || defaultAgency;
  const link1Label = str(row["連結1名稱"]);
  const link1Url = str(row["連結1網址"]);
  const link2Label = str(row["連結2名稱"]);
  const link2Url = str(row["連結2網址"]);

  const others: { label: string; url: string }[] = [];
  const safe1 = getSafeHttpUrl(link1Url);
  const safe2 = getSafeHttpUrl(link2Url);
  if (safe1) others.push({ label: link1Label || "連結1", url: safe1 });
  if (safe2) others.push({ label: link2Label || "連結2", url: safe2 });

  return {
    agency,
    type: mapType(str(row["團種"])),
    title,
    destination: str(row["目的地"]) || "—",
    region: str(row["區域"]) || "—",
    days: parseDays(row["天數"]),
    price_range: str(row["價錢"]) || "—",
    departure_date_statuses: parseDepartureCell(str(row["出發日與成團"])),
    features: parseFeatures(str(row["特色"])),
    affiliate_links: {
      ...(others.length ? { others } : {}),
    },
    image_url: getSafeHttpUrl(str(row["圖片網址"])) || null,
  };
}

function toSourceKey(r: TourRecord): string {
  return [r.agency, r.title, r.destination, String(r.days)].map(slug).join("|");
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const fileArg = process.argv.slice(2).find((a) => a !== "--dry-run" && !a.startsWith("-"));
  if (!fileArg) {
    console.error("用法: npx tsx scripts/upload-tours-from-excel.ts [--dry-run] <檔案.csv>");
    process.exit(1);
  }
  const filePath = resolve(process.cwd(), fileArg);
  if (!existsSync(filePath)) {
    console.error("找不到檔案:", filePath);
    process.exit(1);
  }

  if (!filePath.toLowerCase().endsWith(".csv")) {
    console.error("只支援 CSV 檔案，請使用 .csv");
    process.exit(1);
  }
  const content = readFileSync(filePath, "utf-8");
  const parsed = parseCsv(content);
  const rows = csvRowsToObjects(parsed);
  if (rows.length === 0) {
    console.error("CSV 檔案沒有資料列");
    process.exit(1);
  }
  const headerSet = new Set(Object.keys(rows[0] ?? {}));
  const missing = CSV_HEADERS.filter((x) => !headerSet.has(x));
  if (missing.length > 0) {
    console.error(`CSV 欄位不足，缺少：${missing.join("、")}`);
    process.exit(1);
  }

  const defaultAgency = process.env.SCRAPER_AGENCY ?? "未知旅行社";
  const records: TourRecord[] = [];
  for (const row of rows) {
    const r = rowToRecord(row, defaultAgency);
    if (r) records.push(r);
  }

  if (records.length === 0) {
    console.error("沒有有效資料列（至少需要「行程名稱」）。");
    console.error("提示：若你使用的是範本檔，請先刪除或覆寫「範例旅行社」那一列再上傳。");
    process.exit(1);
  }

  const byKey = new Map<string, TourRecord>();
  for (const r of records) {
    byKey.set(toSourceKey(r), r);
  }
  const unique = [...byKey.values()];

  if (dryRun) {
    console.log(`[dry-run] 共 ${unique.length} 筆（已依 source_key 去重）:\n`);
    for (const r of unique) {
      console.log(JSON.stringify({ ...r, source_key: toSourceKey(r) }, null, 2));
      console.log("---");
    }
    return;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.error("缺少 NEXT_PUBLIC_SUPABASE_URL 與 SUPABASE_SERVICE_ROLE_KEY（或 ANON）");
    process.exit(1);
  }

  const supabase = createClient(url, key);
  const payload = unique.map((r) => ({
    source_key: toSourceKey(r),
    agency: r.agency,
    type: r.type,
    title: r.title,
    destination: r.destination,
    region: r.region,
    days: r.days,
    price_range: r.price_range,
    departure_date_statuses: r.departure_date_statuses,
    features: r.features,
    affiliate_links: r.affiliate_links,
    image_url: r.image_url,
  }));

  const { data, error } = await supabase
    .from("tour")
    .upsert(payload, { onConflict: "source_key", ignoreDuplicates: false })
    .select("id");

  if (error) {
    console.error("Supabase:", error.message);
    if (error.code === "23505") console.error("確認 tour 表已有 source_key 唯一約束（migration 003/004）");
    process.exit(1);
  }
  console.log(`已 upsert ${(data ?? []).length} 筆到 Supabase`);
}

main();
