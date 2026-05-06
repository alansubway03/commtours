/**
 * 匯出旅行社對帳用 ref_id 清單（CSV）
 * 用法：
 * npx tsx scripts/export-referral-clicks.ts --agency="永安旅遊" --from=2026-05-01 --to=2026-05-07 --out=tmp/wingon-week.csv
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
  const from = arg("from")?.trim();
  const to = arg("to")?.trim();
  const out = arg("out")?.trim() ?? `tmp/referral-clicks-${Date.now()}.csv`;
  if (!agency || !from || !to) {
    console.error("缺少參數：--agency --from --to");
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
    .from("referral_click")
    .select("ref_id,tour_id,agency_name,vendor,clicked_at,target_url")
    .eq("agency_name", agency)
    .gte("clicked_at", `${from}T00:00:00.000Z`)
    .lte("clicked_at", `${to}T23:59:59.999Z`)
    .order("clicked_at", { ascending: true });
  if (error) {
    console.error("查詢失敗:", error.message);
    process.exit(1);
  }

  const rows = data ?? [];
  const csv = [
    toCsvRow(["ref_id", "tour_id", "agency_name", "vendor", "clicked_at", "target_url"]),
    ...rows.map((r) =>
      toCsvRow([r.ref_id, r.tour_id, r.agency_name, r.vendor, r.clicked_at, r.target_url])
    ),
  ].join("\n");
  const outPath = resolve(process.cwd(), out);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, csv, "utf-8");
  console.log(`已匯出 ${rows.length} 筆到 ${outPath}`);
}

main();
