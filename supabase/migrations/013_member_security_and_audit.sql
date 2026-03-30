-- 安全強化：
-- 1) 登入失敗次數與鎖定時間
-- 2) 會員操作審計 log（改 email / 改密碼）

ALTER TABLE public.member_account
  ADD COLUMN IF NOT EXISTS failed_login_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS login_locked_until timestamptz,
  ADD COLUMN IF NOT EXISTS last_failed_login_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'member_account_failed_login_count_nonnegative'
  ) THEN
    ALTER TABLE public.member_account
      ADD CONSTRAINT member_account_failed_login_count_nonnegative CHECK (failed_login_count >= 0);
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.member_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.member_account(id) ON DELETE CASCADE,
  action text NOT NULL,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_member_audit_log_member_id_created_at
ON public.member_audit_log (member_id, created_at DESC);

ALTER TABLE public.member_audit_log ENABLE ROW LEVEL SECURITY;
