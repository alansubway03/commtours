-- 每個出發日期的成團狀態：[{ "date": "15/01", "status": "成團" }, ...]
ALTER TABLE "tour" ADD COLUMN IF NOT EXISTS departure_date_statuses jsonb DEFAULT '[]';
COMMENT ON COLUMN "tour".departure_date_statuses IS '每個出發日期與成團狀態，如 15/01 (成團)、17/01 (快將成團)、23/01 (未成團)';
