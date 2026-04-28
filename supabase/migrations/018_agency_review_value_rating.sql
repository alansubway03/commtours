-- 新增「性價比」評分欄位（1-5）
ALTER TABLE public.agency_review
ADD COLUMN IF NOT EXISTS value_rating smallint;

UPDATE public.agency_review
SET value_rating = 3
WHERE value_rating IS NULL;

ALTER TABLE public.agency_review
ALTER COLUMN value_rating SET NOT NULL,
ALTER COLUMN value_rating SET DEFAULT 3;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'agency_review_value_rating_check'
  ) THEN
    ALTER TABLE public.agency_review
      ADD CONSTRAINT agency_review_value_rating_check
      CHECK (value_rating BETWEEN 1 AND 5);
  END IF;
END
$$;
