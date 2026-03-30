-- 會員資料補充欄位
ALTER TABLE public.member_account
  ADD COLUMN IF NOT EXISTS member_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS yearly_trips integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS yearly_group_tours integer NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'member_account_yearly_trips_nonnegative'
  ) THEN
    ALTER TABLE public.member_account
      ADD CONSTRAINT member_account_yearly_trips_nonnegative CHECK (yearly_trips >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'member_account_yearly_group_tours_nonnegative'
  ) THEN
    ALTER TABLE public.member_account
      ADD CONSTRAINT member_account_yearly_group_tours_nonnegative CHECK (yearly_group_tours >= 0);
  END IF;
END
$$;
