-- 會員名稱（忽略大小寫）唯一
-- 問卷欄位（yearly_trips / yearly_group_tours）只儲存在後台，不影響此 migration。
CREATE UNIQUE INDEX IF NOT EXISTS uniq_member_account_member_name_lower
ON public.member_account (lower(member_name))
WHERE member_name <> '';
