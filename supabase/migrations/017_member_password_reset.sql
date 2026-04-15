-- 忘記密碼 token

CREATE TABLE IF NOT EXISTS public.member_password_reset_token (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.member_account(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_member_password_reset_member_created
ON public.member_password_reset_token (member_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_member_password_reset_expires
ON public.member_password_reset_token (expires_at);

ALTER TABLE public.member_password_reset_token ENABLE ROW LEVEL SECURITY;

