-- 會員帳號加 admin flag（用會員 email/密碼登入後，若 is_admin=true 即可使用 Admin API）

ALTER TABLE public.member_account
  ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_member_account_is_admin ON public.member_account(is_admin);

