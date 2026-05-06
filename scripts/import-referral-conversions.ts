/**
 * 匯入旅行社回傳對帳 CSV（ref_id, booking_id, status, paid_amount, paid_at, departure_date）
 * 用法：
 * npx tsx scripts/import-referral-conversions.ts --file=tmp/agency-response.csv --month=2026-05 --source=wingon-week19
 */
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { parseCsvLine } from "./referral-csv-utils";

const envPath = resolve(process.cwd(), ".env.local");
if (existsSync(envPath)) {
  const content = readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
  }
}

function arg(name: string): string | undefined {
  const key = `--${name}=`;
  const found = process.argv.find((x) => x.startsWith(key));
  return found ? found.slice(key.length) : undefined;
}

function normalizeStatus(input: string): "paid" | "unpaid" | "cancelled" {
  const v = input.trim().toLowerCase();
  if (v === "paid") return "paid";
  if (v === "cancelled" || v === "canceled") return "cancelled";
  return "unpaid";
}

async function main() {
  const file = arg("file");
  const month = arg("month") ?? new Date().toISOString().slice(0, 7);
  const source = arg("source") ?? "manual_csv";
  if (!file) {
    console.error("缺少 --file 參數");
    process.exit(1);
  }

  const abs = resolve(process.cwd(), file);
  if (!existsSync(abs)) {
    console.error(`找不到檔案: ${abs}`);
    process.exit(1);
  }
  const csv = readFileSync(abs, "utf-8");
  const lines = csv.split(/\r?\n/).filter((x) => x.trim().length > 0);
  if (lines.length < 2) {
    console.error("CSV 無資料。");
    process.exit(1);
  }
  const header = parseCsvLine(lines[0]).map((x) => x.trim().toLowerCase());
  const idx = {
    refId: header.indexOf("ref_id"),
    bookingId: header.indexOf("booking_id"),
    status: header.indexOf("status"),
    paidAmount: header.indexOf("paid_amount"),
    paidAt: header.indexOf("paid_at"),
    departureDate: header.indexOf("departure_date"),
  };
  if (idx.refId < 0 || idx.bookingId < 0 || idx.status < 0) {
    console.error("CSV 欄位不足，至少需要 ref_id, booking_id, status");
    process.exit(1);
  }

  const upserts = lines.slice(1).map((line) => {
    const cols = parseCsvLine(line);
    const refId = cols[idx.refId]?.trim() ?? "";
    const bookingId = cols[idx.bookingId]?.trim() ?? "";
    if (!refId || !bookingId) return null;
    const status = normalizeStatus(cols[idx.status] ?? "");
    const amountRaw = idx.paidAmount >= 0 ? cols[idx.paidAmount]?.trim() : "";
    const paidAmount = amountRaw ? Number(amountRaw) : null;
    return {
      ref_id: refId,
      agency_booking_id: bookingId,
      status,
      paid_amount: Number.isFinite(paidAmount as number) ? paidAmount : null,
      paid_at: idx.paidAt >= 0 ? cols[idx.paidAt]?.trim() || null : null,
      departure_date: idx.departureDate >= 0 ? cols[idx.departureDate]?.trim() || null : null,
      settlement_month: month,
      source_file: source,
    };
  }).filter((x): x is NonNullable<typeof x> => x !== null);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.error("缺少 Supabase 連線設定。");
    process.exit(1);
  }
  const supabase = createClient(url, key);
  const { error } = await supabase
    .from("referral_conversion")
    .upsert(upserts, { onConflict: "ref_id,agency_booking_id", ignoreDuplicates: false });
  if (error) {
    console.error("匯入失敗:", error.message);
    process.exit(1);
  }
  console.log(`已匯入 ${upserts.length} 筆 conversion。`);
}

main();
