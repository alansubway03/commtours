-- 評分審核：僅 approved 可公開讀取；新提交的評分預設為 pending
-- 顯示名稱存在 tour_review，公開列表不需讀 member_account

ALTER TABLE public.tour_review
  ADD COLUMN IF NOT EXISTS moderation_status text NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS moderated_at timestamptz,
  ADD COLUMN IF NOT EXISTS moderation_note text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS reviewer_display_name text NOT NULL DEFAULT '';

-- 此後新列預設待審核（已存在資料仍為 approved）
ALTER TABLE public.tour_review
  ALTER COLUMN moderation_status SET DEFAULT 'pending';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tour_review_moderation_status_check'
  ) THEN
    ALTER TABLE public.tour_review
      ADD CONSTRAINT tour_review_moderation_status_check
      CHECK (moderation_status IN ('pending', 'approved', 'rejected'));
  END IF;
END
$$;

UPDATE public.tour_review tr
SET reviewer_display_name = COALESCE(NULLIF(TRIM(ma.member_name), ''), '會員')
FROM public.member_account ma
WHERE tr.member_id = ma.id
  AND (tr.reviewer_display_name = '' OR TRIM(tr.reviewer_display_name) = '');

UPDATE public.tour_review
SET moderated_at = created_at
WHERE moderation_status = 'approved' AND moderated_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_tour_review_moderation_status ON public.tour_review(moderation_status);

DROP POLICY IF EXISTS "allow_public_read_tour_reviews" ON public.tour_review;
CREATE POLICY "allow_public_read_approved_tour_reviews" ON public.tour_review
  FOR SELECT
  USING (moderation_status = 'approved');

DROP POLICY IF EXISTS "allow_public_read_tour_review_photos" ON public.tour_review_photo;
CREATE POLICY "allow_public_read_approved_tour_review_photos" ON public.tour_review_photo
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tour_review r
      WHERE r.id = tour_review_photo.review_id
        AND r.moderation_status = 'approved'
    )
  );
