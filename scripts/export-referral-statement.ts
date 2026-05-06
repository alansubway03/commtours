/**
 * 匯出月結 statement（只計 paid）
 * 用法：
 * npx tsx scripts/export-referral-statement.ts --agency="永安旅遊" --month=2026-05 --rate=0.05 --out=tmp/statement-wingon-2026-05.csv
 */
import { createClient } from "@supabase/supabase-js";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { toCsvRow } from "./referral-csv-utils";

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

async function main() {
  const agency = arg("agency")?.trim();
  const month = arg("month")?.trim();
  const rate = Number(arg("rate") ?? "0.05");
  const out = arg("out")?.trim() ?? `tmp/referral-statement-${Date.now()}.csv`;
  if (!agency || !month) {
    console.error("缺少 --agency 或 --month");
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.error("缺少 Supabase 連線設定。");
    process.exit(1);
  }
  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from("referral_conversion")
    .select("ref_id,agency_booking_id,paid_amount,paid_at,departure_date,status,settlement_month,referral_click!inner(agency_name,tour_id)")
    .eq("settlement_month", month)
    .eq("status", "paid")
    .eq("referral_click.agency_name", agency);
  if (error) {
    console.error("查詢失敗:", error.message);
    process.exit(1);
  }

  let totalPaid = 0;
  const rows = (data ?? []).map((r) => {
    const paidAmount = Number(r.paid_amount ?? 0);
    const commission = Math.round(paidAmount * rate * 100) / 100;
    totalPaid += commission;
    return {
      refId: r.ref_id,
      bookingId: r.agency_booking_id,
      paidAmount: paidAmount.toFixed(2),
      commission: commission.toFixed(2),
      paidAt: r.paid_at ?? "",
      departureDate: r.departure_date ?? "",
      tourId: (r.referral_click as { tour_id?: number } | null)?.tour_id ?? "",
    };
  });

  const csv = [
    toCsvRow(["settlement_month", month]),
    toCsvRow(["agency_name", agency]),
    toCsvRow(["commission_rate", rate]),
    toCsvRow(["total_commission_hkd", totalPaid.toFixed(2)]),
    "",
    toCsvRow(["ref_id", "agency_booking_id", "tour_id", "paid_amount_hkd", "commission_hkd", "paid_at", "departure_date"]),
    ...rows.map((r) =>
      toCsvRow([r.refId, r.bookingId, r.tourId, r.paidAmount, r.commission, r.paidAt, r.departureDate])
    ),
  ].join("\n");

  const outPath = resolve(process.cwd(), out);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, csv, "utf-8");
  console.log(`已輸出 statement：${outPath}（共 ${rows.length} 筆，佣金 HKD ${totalPaid.toFixed(2)}）`);
}

main();
