-- 旅行社獨立評分系統
-- 將評分主體由「旅行團 tour_id」改為「旅行社 agency + 目的地分類」

CREATE TABLE IF NOT EXISTS public.agency_review (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.member_account(id) ON DELETE CASCADE,
  agency text NOT NULL,
  destination_category text NOT NULL DEFAULT '其他',
  group_code text NOT NULL DEFAULT '',
  source_tour_id bigint REFERENCES public.tour(id) ON DELETE SET NULL,
  itinerary_rating smallint NOT NULL CHECK (itinerary_rating BETWEEN 1 AND 5),
  meal_rating smallint NOT NULL CHECK (meal_rating BETWEEN 1 AND 5),
  hotel_rating smallint NOT NULL CHECK (hotel_rating BETWEEN 1 AND 5),
  guide_rating smallint NOT NULL CHECK (guide_rating BETWEEN 1 AND 5),
  will_rebook boolean NOT NULL,
  comment text NOT NULL DEFAULT '',
  extra_info text NOT NULL DEFAULT '',
  participation_proof text NOT NULL DEFAULT '',
  base_fee_hkd numeric(10,2) NOT NULL DEFAULT 0,
  optional_activity_fee_hkd numeric(10,2) NOT NULL DEFAULT 0,
  staff_service_fee_hkd numeric(10,2) NOT NULL DEFAULT 0,
  moderation_status text NOT NULL DEFAULT 'approved',
  moderated_at timestamptz,
  moderation_note text NOT NULL DEFAULT '',
  reviewer_display_name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'agency_review_moderation_status_check'
  ) THEN
    ALTER TABLE public.agency_review
      ADD CONSTRAINT agency_review_moderation_status_check
      CHECK (moderation_status IN ('pending', 'approved', 'rejected'));
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_agency_review_member_agency_group
ON public.agency_review (member_id, agency, group_code);

CREATE INDEX IF NOT EXISTS idx_agency_review_agency ON public.agency_review(agency);
CREATE INDEX IF NOT EXISTS idx_agency_review_moderation_status ON public.agency_review(moderation_status);
CREATE INDEX IF NOT EXISTS idx_agency_review_created_at ON public.agency_review(created_at DESC);

CREATE TABLE IF NOT EXISTS public.agency_review_photo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES public.agency_review(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  public_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agency_review_photo_review_id ON public.agency_review_photo(review_id);

ALTER TABLE public.agency_review ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_review_photo ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_public_read_approved_agency_reviews" ON public.agency_review;
CREATE POLICY "allow_public_read_approved_agency_reviews" ON public.agency_review
  FOR SELECT
  USING (moderation_status = 'approved');

DROP POLICY IF EXISTS "allow_public_read_approved_agency_review_photos" ON public.agency_review_photo;
CREATE POLICY "allow_public_read_approved_agency_review_photos" ON public.agency_review_photo
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.agency_review r
      WHERE r.id = agency_review_photo.review_id
        AND r.moderation_status = 'approved'
    )
  );

-- Backfill：把舊 tour_review 轉入 agency_review
INSERT INTO public.agency_review (
  member_id,
  agency,
  destination_category,
  group_code,
  source_tour_id,
  itinerary_rating,
  meal_rating,
  hotel_rating,
  guide_rating,
  will_rebook,
  comment,
  extra_info,
  participation_proof,
  base_fee_hkd,
  optional_activity_fee_hkd,
  staff_service_fee_hkd,
  moderation_status,
  moderated_at,
  moderation_note,
  reviewer_display_name,
  created_at,
  updated_at
)
SELECT
  tr.member_id,
  COALESCE(NULLIF(TRIM(t.agency), ''), '旅行社'),
  COALESCE(NULLIF(TRIM(t.region), ''), '其他'),
  COALESCE(NULLIF(TRIM(regexp_replace(tr.participation_proof, '.*團號\s*[:：]?\s*', '', '')), ''), tr.id::text),
  tr.tour_id,
  tr.itinerary_rating,
  tr.meal_rating,
  tr.hotel_rating,
  tr.guide_rating,
  tr.will_rebook,
  tr.comment,
  tr.extra_info,
  COALESCE(tr.participation_proof, ''),
  COALESCE(tr.base_fee_hkd, 0),
  COALESCE(tr.optional_activity_fee_hkd, 0),
  COALESCE(tr.staff_service_fee_hkd, 0),
  COALESCE(tr.moderation_status, 'approved'),
  tr.moderated_at,
  COALESCE(tr.moderation_note, ''),
  COALESCE(NULLIF(TRIM(tr.reviewer_display_name), ''), '會員'),
  tr.created_at,
  tr.updated_at
FROM public.tour_review tr
LEFT JOIN public.tour t ON t.id = tr.tour_id
ON CONFLICT DO NOTHING;

-- Backfill：舊照片轉入 agency_review_photo
INSERT INTO public.agency_review_photo (review_id, storage_path, public_url, created_at)
SELECT
  ar.id,
  p.storage_path,
  p.public_url,
  p.created_at
FROM public.tour_review_photo p
JOIN public.tour_review tr ON tr.id = p.review_id
JOIN public.tour t ON t.id = tr.tour_id
JOIN public.agency_review ar
  ON ar.member_id = tr.member_id
 AND ar.agency = COALESCE(NULLIF(TRIM(t.agency), ''), '旅行社')
 AND ar.source_tour_id = tr.tour_id
 AND ar.created_at = tr.created_at
ON CONFLICT DO NOTHING;
