-- 會員制度 + 評分系統
-- 包含：
-- 1) 會員帳號（email / tel + password hash）
-- 2) 每週推廣訂閱
-- 3) 旅行團評分（需參團證明）
-- 4) 評分照片

CREATE TABLE IF NOT EXISTS public.member_account (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  tel text NOT NULL,
  password_hash text NOT NULL,
  weekly_promo_subscribed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.member_session (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.member_account(id) ON DELETE CASCADE,
  session_token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.member_newsletter_optin (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL UNIQUE REFERENCES public.member_account(id) ON DELETE CASCADE,
  email text NOT NULL,
  subscribed boolean NOT NULL DEFAULT true,
  subscribed_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tour_review (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id bigint NOT NULL REFERENCES public.tour(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.member_account(id) ON DELETE CASCADE,
  itinerary_rating smallint NOT NULL CHECK (itinerary_rating BETWEEN 1 AND 5),
  meal_rating smallint NOT NULL CHECK (meal_rating BETWEEN 1 AND 5),
  hotel_rating smallint NOT NULL CHECK (hotel_rating BETWEEN 1 AND 5),
  guide_rating smallint NOT NULL CHECK (guide_rating BETWEEN 1 AND 5),
  will_rebook boolean NOT NULL,
  comment text NOT NULL DEFAULT '',
  extra_info text NOT NULL DEFAULT '',
  participation_proof text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tour_review_photo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES public.tour_review(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  public_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_member_account_email ON public.member_account(email);
CREATE INDEX IF NOT EXISTS idx_member_session_token ON public.member_session(session_token);
CREATE INDEX IF NOT EXISTS idx_tour_review_tour_id ON public.tour_review(tour_id);
CREATE INDEX IF NOT EXISTS idx_tour_review_member_id ON public.tour_review(member_id);
CREATE INDEX IF NOT EXISTS idx_tour_review_photo_review_id ON public.tour_review_photo(review_id);

ALTER TABLE public.member_account ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_session ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_newsletter_optin ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_review ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_review_photo ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'tour_review' AND policyname = 'allow_public_read_tour_reviews'
  ) THEN
    CREATE POLICY "allow_public_read_tour_reviews" ON public.tour_review
      FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'tour_review_photo' AND policyname = 'allow_public_read_tour_review_photos'
  ) THEN
    CREATE POLICY "allow_public_read_tour_review_photos" ON public.tour_review_photo
      FOR SELECT
      USING (true);
  END IF;
END
$$;
