-- 登入安全：帳號 + IP 維度失敗次數與鎖定
CREATE TABLE IF NOT EXISTS public.member_login_attempt (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  ip text NOT NULL,
  failed_count integer NOT NULL DEFAULT 0,
  locked_until timestamptz,
  last_failed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (email, ip)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'member_login_attempt_failed_count_nonnegative'
  ) THEN
    ALTER TABLE public.member_login_attempt
      ADD CONSTRAINT member_login_attempt_failed_count_nonnegative CHECK (failed_count >= 0);
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_member_login_attempt_email_ip
ON public.member_login_attempt (email, ip);

ALTER TABLE public.member_login_attempt ENABLE ROW LEVEL SECURITY;
