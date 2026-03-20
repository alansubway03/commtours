-- tours 表結構（之後執行 migration 用）
-- 執行: supabase db push 或於 Dashboard SQL Editor 執行

CREATE TYPE tour_type AS ENUM (
  'longhaul',
  'cruise',
  'cruise_ticket',
  'hiking',
  'diving',
  'festival'
);

CREATE TABLE IF NOT EXISTS tours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency TEXT NOT NULL,
  type tour_type NOT NULL,
  title TEXT NOT NULL,
  destination TEXT NOT NULL,
  region TEXT NOT NULL,
  days INTEGER NOT NULL,
  price_range TEXT NOT NULL,
  departure_dates TEXT[] DEFAULT '{}',
  features TEXT[] DEFAULT '{}',
  affiliate_links JSONB DEFAULT '{}',
  image_url TEXT,
  last_updated DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tours_type ON tours (type);
CREATE INDEX IF NOT EXISTS idx_tours_region ON tours (region);
CREATE INDEX IF NOT EXISTS idx_tours_days ON tours (days);
CREATE INDEX IF NOT EXISTS idx_tours_last_updated ON tours (last_updated);

-- RLS 範例（可選）
-- ALTER TABLE tours ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow public read" ON tours FOR SELECT USING (true);
