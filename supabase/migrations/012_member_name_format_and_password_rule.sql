-- 會員名稱格式：2-20 字，只限英數
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'member_account_member_name_format'
  ) THEN
    ALTER TABLE public.member_account
      ADD CONSTRAINT member_account_member_name_format
      CHECK (member_name ~ '^[A-Za-z0-9]{2,20}$')
      NOT VALID;
  END IF;
END
$$;
