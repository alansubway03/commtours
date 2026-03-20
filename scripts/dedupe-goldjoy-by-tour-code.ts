/**
 * 金怡假期：依官網團號（affiliate_links.goldjoy 的 code=）去重，每團號只留一筆。
 * 解決「同一團因 source_key 不同（slug / 舊格式）而佔多列」導致列表 40+ 筆的問題。
 *
 *   npx tsx scripts/dedupe-goldjoy-by-tour-code.ts           # 預覽將刪除的 id
 *   npx tsx scripts/dedupe-goldjoy-by-tour-code.ts --execute
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const AGENCY = "金怡假期";

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

function extractCode(links: unknown): string | null {
  if (!links || typeof links !== "object") return null;
  const u = (links as Record<string, unknown>).goldjoy;
  if (typeof u !== "string") return null;
  const m = u.match(/[?&]code=([^&]+)/i);
  if (!m) return null;
  try {
    return decodeURIComponent(m[1]).trim();
  } catch {
    return m[1].trim();
  }
}

function depLen(v: unknown): number {
  return Array.isArray(v) ? v.length : 0;
}

/** 分數高者保留：標準 source_key、出發日較多、較新 */
function score(r: {
  source_key: string | null;
  departure_date_statuses: unknown;
  updated_at: string | null;
  id: number;
}): number {
  const sk = (r.source_key ?? "").trim();
  let s = 0;
  if (/^goldjoy:[A-Za-z0-9-]+$/i.test(sk)) s += 1_000_000;
  s += depLen(r.departure_date_statuses) * 1000;
  const t = r.updated_at ? new Date(r.updated_at).getTime() : 0;
  s += Math.min(t / 86400000, 50000);
  s += r.id / 1_000_000;
  return s;
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
    .select("id, source_key, title, affiliate_links, departure_date_statuses, updated_at")
    .eq("agency", AGENCY);

  if (error) {
    console.error(error.message);
    process.exit(1);
  }

  const list = rows ?? [];
  const byCode = new Map<string, typeof list>();
  const noCode: typeof list = [];

  for (const r of list) {
    const code = extractCode(r.affiliate_links);
    if (!code) {
      noCode.push(r);
      continue;
    }
    const k = code.toUpperCase();
    if (!byCode.has(k)) byCode.set(k, []);
    byCode.get(k)!.push(r);
  }

  const toDelete: number[] = [];
  const duplicateGroups: { code: string; keepId: number; removeIds: number[] }[] = [];

  for (const [k, group] of byCode) {
    if (group.length <= 1) continue;
    const sorted = [...group].sort((a, b) => score(b) - score(a));
    const keep = sorted[0]!;
    const remove = sorted.slice(1).map((r) => r.id);
    toDelete.push(...remove);
    duplicateGroups.push({ code: k, keepId: keep.id, removeIds: remove });
  }

  console.log(`金怡假期共 ${list.length} 筆。`);
  console.log(`可從連結解析團號：${list.length - noCode.length} 筆；無 code 連結：${noCode.length} 筆。`);
  console.log(`依團號重複的群組：${duplicateGroups.length} 個，將刪除 ${toDelete.length} 筆。\n`);

  for (const g of duplicateGroups.slice(0, 15)) {
    console.log(
      `  團號 ${g.code}: 保留 id=${g.keepId}，刪除 id=${g.removeIds.join(",")}`
    );
  }
  if (duplicateGroups.length > 15) {
    console.log(`  … 其餘 ${duplicateGroups.length - 15} 群組`);
  }

  if (noCode.length > 0 && noCode.length <= 10) {
    console.log("\n無 goldjoy code 的列（不會被此腳本刪除）：");
    for (const r of noCode) {
      console.log(`  id=${r.id} source_key=${r.source_key ?? "(null)"}`);
    }
  } else if (noCode.length > 10) {
    console.log(`\n無 goldjoy code 的列共 ${noCode.length} 筆（請手動檢查）。`);
  }

  if (toDelete.length === 0) {
    console.log(
      "\n沒有「同一團號多筆」可合併。若仍顯示 41 筆，代表 41 筆的團號（或連結）皆不同，請把列表 export 或截圖 source_key。"
    );
    return;
  }

  if (!execute) {
    console.log("\n僅預覽。執行刪除：");
    console.log("  npx tsx scripts/dedupe-goldjoy-by-tour-code.ts --execute");
    return;
  }

  const { error: delErr } = await supabase.from("tour").delete().in("id", toDelete);
  if (delErr) {
    console.error("刪除失敗:", delErr.message);
    process.exit(1);
  }
  console.log(`\n已刪除 ${toDelete.length} 筆。預期剩餘金怡約 ${list.length - toDelete.length} 筆。`);
}

main();
