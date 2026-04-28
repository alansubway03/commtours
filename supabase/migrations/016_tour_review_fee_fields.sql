-- 在會員評價加入費用明細（HKD）
ALTER TABLE public.tour_review
  ADD COLUMN IF NOT EXISTS base_fee_hkd numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS optional_activity_fee_hkd numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS staff_service_fee_hkd numeric(10,2) NOT NULL DEFAULT 0;
