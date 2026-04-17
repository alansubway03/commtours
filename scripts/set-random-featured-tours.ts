/**
 * 從 tour 表隨機挑 10 筆，標記為「熱門行程」。
 * 其他行程會移除「熱門行程」標籤。
 *
 * 用法：
 *   npx tsx scripts/set-random-featured-tours.ts
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { FEATURED_TOUR_TAG } from "../lib/featuredTours";

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

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "缺少 NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from("tour")
    .select("id,features")
    .order("id", { ascending: true });
  if (error) throw new Error(error.message);

  const rows =
    (data as { id: number; features: string[] | null }[] | null) ?? [];
  if (rows.length === 0) {
    console.log("tour 表目前沒有資料。");
    return;
  }

  const picked = new Set(shuffle(rows).slice(0, 10).map((r) => r.id));
  let updated = 0;

  for (const row of rows) {
    const base = (row.features ?? []).filter((x) => x !== FEATURED_TOUR_TAG);
    const next = picked.has(row.id) ? [...base, FEATURED_TOUR_TAG] : base;
    const { error: updateError } = await supabase
      .from("tour")
      .update({ features: next })
      .eq("id", row.id);
    if (updateError) throw new Error(updateError.message);
    updated += 1;
  }

  console.log(`已更新 ${updated} 筆，熱門行程數量 ${picked.size}。`);
  console.log(`熱門行程 ID：${[...picked].join(", ")}`);
}

main().catch((e) => {
  console.error("設定熱門行程失敗：", e.message ?? e);
  process.exit(1);
});

