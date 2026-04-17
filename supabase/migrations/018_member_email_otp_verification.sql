-- Email OTP 驗證：新註冊會員需先完成 Email 驗證才可登入

ALTER TABLE public.member_account
  ADD COLUMN IF NOT EXISTS email_verified_at timestamptz;

-- 既有會員視為已驗證，避免升級後被鎖在外
UPDATE public.member_account
SET email_verified_at = COALESCE(email_verified_at, created_at);

CREATE TABLE IF NOT EXISTS public.member_email_verification_code (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.member_account(id) ON DELETE CASCADE,
  email text NOT NULL,
  purpose text NOT NULL DEFAULT 'email_verify',
  code_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 5,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'member_email_verification_code_attempts_nonnegative'
  ) THEN
    ALTER TABLE public.member_email_verification_code
      ADD CONSTRAINT member_email_verification_code_attempts_nonnegative CHECK (attempts >= 0);
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_member_email_verification_member_created
ON public.member_email_verification_code (member_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_member_account_email_verified_at
ON public.member_account (email_verified_at);

ALTER TABLE public.member_email_verification_code ENABLE ROW LEVEL SECURITY;
