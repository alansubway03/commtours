/**
 * 從 Supabase tour 表刪除指定旅行社的資料
 * 用法：npx tsx scripts/delete-tours-by-agency.ts
 * 預設刪除：金怡假期、縱橫遊WWPKG
 *
 * 環境變數：.env.local 內 NEXT_PUBLIC_SUPABASE_URL、SUPABASE_SERVICE_ROLE_KEY
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

const AGENCIES_TO_DELETE = ["金怡假期", "縱橫遊WWPKG"];

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.error("缺少 NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const supabase = createClient(url, key);

  for (const agency of AGENCIES_TO_DELETE) {
    const { data, error } = await supabase.from("tour").delete().eq("agency", agency).select("id");
    if (error) {
      console.error(`刪除「${agency}」時錯誤:`, error.message);
      continue;
    }
    const count = (data ?? []).length;
    console.log(`已刪除「${agency}」${count} 筆`);
  }
  console.log("完成。");
}

main();
