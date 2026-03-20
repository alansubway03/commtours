/**
 * 刪除金怡「舊版 source_key」列：goldjoy:團號:出發日（每出發日一筆），
 * 與現行 goldjoy:團號（一團一筆）併存時，列表會出現重複團。
 *
 * 用法：
 *   npx tsx scripts/cleanup-goldjoy-legacy-rows.ts        # 先列出將刪除的 id/source_key
 *   npx tsx scripts/cleanup-goldjoy-legacy-rows.ts --execute
 *
 * 若執行後仍多筆，代表重複列的 source_key 不是「三段式」；請改跑：
 *   npx tsx scripts/dedupe-goldjoy-by-tour-code.ts --execute
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

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

/** 現行：goldjoy:CODE（2 段）。舊版：goldjoy:CODE:日期鍵…（≥3 段） */
function isLegacyGoldjoySourceKey(sourceKey: string | null): boolean {
  if (!sourceKey?.startsWith("goldjoy:")) return false;
  return sourceKey.split(":").length >= 3;
}

async function main() {
  const execute = process.argv.includes("--execute");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.error("缺少 NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const supabase = createClient(url, key);
  const { data: rows, error } = await supabase
    .from("tour")
    .select("id, source_key, title")
    .eq("agency", "金怡假期");

  if (error) {
    console.error(error.message);
    process.exit(1);
  }

  const legacy = (rows ?? []).filter((r) =>
    isLegacyGoldjoySourceKey(typeof r.source_key === "string" ? r.source_key : null)
  );

  console.log(
    `金怡假期共 ${rows?.length ?? 0} 筆；其中舊版 source_key（goldjoy:團號:…）${legacy.length} 筆。`
  );
  if (legacy.length === 0) {
    console.log("無需清理。");
    return;
  }

  for (const r of legacy.slice(0, 20)) {
    console.log(`  id=${r.id}  ${r.source_key}`);
  }
  if (legacy.length > 20) console.log(`  … 其餘 ${legacy.length - 20} 筆`);

  if (!execute) {
    console.log("\n僅預覽。若要刪除請執行：");
    console.log("  npx tsx scripts/cleanup-goldjoy-legacy-rows.ts --execute");
    return;
  }

  const ids = legacy.map((r) => r.id);
  const { error: delErr } = await supabase.from("tour").delete().in("id", ids);
  if (delErr) {
    console.error("刪除失敗:", delErr.message);
    process.exit(1);
  }
  console.log(`已刪除 ${ids.length} 筆舊版金怡列。請重新整理列表（應剩約 16 筆一團一筆）。`);
}

main();
