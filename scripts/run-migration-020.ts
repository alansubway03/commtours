/**
 * 執行 020：新增 referral click/conversion 追蹤表
 *
 * 需在 .env.local 設定：
 *   DATABASE_URL=postgresql://...
 *
 * 執行：npx tsx scripts/run-migration-020.ts
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
  console.error("缺少 DATABASE_URL（或 DIRECT_URL），無法執行 migration 020。");
  process.exit(1);
}

const sqlPath = resolve(
  process.cwd(),
  "supabase/migrations/020_referral_tracking_and_settlement.sql"
);
const sql = readFileSync(sqlPath, "utf-8");

async function main() {
  const client = new pg.Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
  });
  try {
    await client.connect();
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("COMMIT");
    console.log("Migration 020 已成功執行。");
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("執行失敗:", e instanceof Error ? e.message : e);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
