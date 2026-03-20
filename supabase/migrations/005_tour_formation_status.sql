-- 成團狀態：成團 / 未成團（供前端顯示）
ALTER TABLE "tour" ADD COLUMN IF NOT EXISTS formation_status text DEFAULT '未成團';
COMMENT ON COLUMN "tour".formation_status IS '成團狀態：成團 或 未成團';
