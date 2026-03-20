-- 供每日更新時 upsert 用：用 source_key 辨識同一筆行程，有則更新、無則新增
-- 執行：Supabase SQL Editor 或 supabase db push

ALTER TABLE "tour" ADD COLUMN IF NOT EXISTS source_key text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_tour_source_key ON "tour" (source_key) WHERE source_key IS NOT NULL;

COMMENT ON COLUMN "tour".source_key IS '唯一鍵：agency|title|destination|days，供 upsert 用';
