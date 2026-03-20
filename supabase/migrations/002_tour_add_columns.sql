-- 請只貼上本檔案「內容」到 SQL Editor，不要貼檔名（例如 002_tour_add_columns.sql）
-- =============================================================================
-- Migration: 為 public.tour 表新增欄位 + RLS
-- 適用：Supabase SQL Editor 直接執行（idempotent，可重複執行）
-- 表現有：id (int8), created_at (timestamptz)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. 新增欄位（ADD COLUMN IF NOT EXISTS，已存在則跳過）
-- -----------------------------------------------------------------------------

ALTER TABLE "tour" ADD COLUMN IF NOT EXISTS agency text NOT NULL DEFAULT '';
ALTER TABLE "tour" ADD COLUMN IF NOT EXISTS title text NOT NULL DEFAULT '';
ALTER TABLE "tour" ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'longhaul'
  CHECK (type IN ('longhaul', 'cruise', 'cruise_ticket', 'hiking', 'diving', 'festival'));
ALTER TABLE "tour" ADD COLUMN IF NOT EXISTS destination text NOT NULL DEFAULT '';
ALTER TABLE "tour" ADD COLUMN IF NOT EXISTS region text NOT NULL DEFAULT '';
ALTER TABLE "tour" ADD COLUMN IF NOT EXISTS days integer NOT NULL DEFAULT 0;
ALTER TABLE "tour" ADD COLUMN IF NOT EXISTS price_range text NOT NULL DEFAULT '';
ALTER TABLE "tour" ADD COLUMN IF NOT EXISTS departure_dates text[] DEFAULT '{}';
ALTER TABLE "tour" ADD COLUMN IF NOT EXISTS features text[] DEFAULT '{}';
ALTER TABLE "tour" ADD COLUMN IF NOT EXISTS affiliate_links jsonb DEFAULT '{}';
ALTER TABLE "tour" ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE "tour" ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- -----------------------------------------------------------------------------
-- 2. 欄位說明（COMMENT ON COLUMN）
-- -----------------------------------------------------------------------------

COMMENT ON COLUMN "tour".agency IS '旅行社/代理商名稱';
COMMENT ON COLUMN "tour".title IS '團體行程標題';
COMMENT ON COLUMN "tour".type IS '類型: longhaul/cruise/cruise_ticket/hiking/diving/festival';
COMMENT ON COLUMN "tour".destination IS '目的地描述';
COMMENT ON COLUMN "tour".region IS '地區（如歐洲、北美）';
COMMENT ON COLUMN "tour".days IS '行程天數';
COMMENT ON COLUMN "tour".price_range IS '價錢範圍，如 $28,000-$38,000';
COMMENT ON COLUMN "tour".departure_dates IS '出發日期列表';
COMMENT ON COLUMN "tour".features IS '特色標籤，如純玩、無購物';
COMMENT ON COLUMN "tour".affiliate_links IS '聯盟連結 JSON，如 wingon/tripdotcom';
COMMENT ON COLUMN "tour".image_url IS '主圖 URL';
COMMENT ON COLUMN "tour".updated_at IS '最後更新時間';

-- -----------------------------------------------------------------------------
-- 3. 啟用 RLS（若已啟用則無副作用）
-- -----------------------------------------------------------------------------

ALTER TABLE "tour" ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 4. 建立公開讀取 policy（若已存在則跳過，避免錯誤）
-- -----------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'tour' AND policyname = 'allow_public_select_tour'
  ) THEN
    CREATE POLICY "allow_public_select_tour" ON "tour"
      FOR SELECT
      USING (true);
  END IF;
END
$$;
