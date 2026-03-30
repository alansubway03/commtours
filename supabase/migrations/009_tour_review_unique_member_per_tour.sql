-- 每位會員同一旅行團只可評分一次
CREATE UNIQUE INDEX IF NOT EXISTS uniq_tour_review_tour_member
ON public.tour_review (tour_id, member_id);
