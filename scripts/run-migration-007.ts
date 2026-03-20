/**
 * 執行 007：回填 departure_date_statuses 後刪除 departure_dates、formation_status
 *
 * 需在 .env.local 設定（二選一）：
 *   DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[密碼]@db.[PROJECT-REF].supabase.co:5432/postgres
 * 密碼：Supabase Dashboard → Project Settings → Database → Database password
 *
 * 執行：npx tsx scripts/run-migration-007.ts
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import pg from "pg";

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

const url = process.env.DATABASE_URL ?? process.env.DIRECT_URL;
if (!url || !url.startsWith("postgres")) {
  console.error(
    "缺少 DATABASE_URL（或 DIRECT_URL）。請在 Supabase → Settings → Database 複製 Connection string（URI），\n" +
      "寫入 .env.local 一行：DATABASE_URL=postgresql://postgres.xxx:你的密碼@db.xxx.supabase.co:5432/postgres\n" +
      "或到 SQL Editor 手動貼上 supabase/migrations/007_tour_drop_departure_dates_formation_status.sql 內容執行。"
  );
  process.exit(1);
}

const sqlPath = resolve(process.cwd(), "supabase/migrations/007_tour_drop_departure_dates_formation_status.sql");
const sql = readFileSync(sqlPath, "utf-8");

async function main() {
  const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("COMMIT");
    console.log("Migration 007 已成功執行：已回填並刪除 departure_dates、formation_status 欄位。");
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("執行失敗:", e instanceof Error ? e.message : e);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
