-- 讓 Supabase upsert 能使用 source_key：先補齊 NULL，再加 UNIQUE 約束
-- 執行：Supabase SQL Editor（若 003 已跑過，只跑本檔即可）

-- 若有舊資料 source_key 為 NULL，先填成唯一值，否則無法加 UNIQUE
UPDATE "tour"
SET source_key = 'legacy-' || id::text
WHERE source_key IS NULL;

-- 刪除 003 的 partial unique index（改用下面約束）
DROP INDEX IF EXISTS idx_tour_source_key;

-- 加上 UNIQUE 約束，Supabase onConflict 才能用
ALTER TABLE "tour"
ADD CONSTRAINT tour_source_key_key UNIQUE (source_key);
