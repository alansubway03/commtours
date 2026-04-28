"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export type AdminReviewItem = {
  id: string;
  source_tour_id: number | null;
  moderation_status: "pending" | "approved" | "rejected";
  reviewer_display_name: string | null;
  itinerary_rating: number;
  meal_rating: number;
  hotel_rating: number;
  guide_rating: number;
  value_rating: number | null;
  will_rebook: boolean;
  comment: string | null;
  extra_info: string | null;
  participation_proof: string | null;
  created_at: string;
  tour: { id: string; title: string; agency: string } | { id: string; title: string; agency: string }[] | null;
  member_account: { email: string | null; member_name: string | null } | { email: string | null; member_name: string | null }[] | null;
  agency_review_photo: { id: string; public_url: string; created_at: string }[] | null;
};

function avgScore(x: AdminReviewItem): string {
  const n =
    (x.itinerary_rating +
      x.meal_rating +
      x.hotel_rating +
      x.guide_rating +
      Number(x.value_rating ?? 3)) /
    5;
  return n.toFixed(1);
}

export function AdminReviewModerationClient({ initialReviews }: { initialReviews: AdminReviewItem[] }) {
  const [reviews, setReviews] = useState<AdminReviewItem[]>(initialReviews);
  const [noteById, setNoteById] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");
  const [isPending, startTransition] = useTransition();

  const pendingCount = useMemo(
    () => reviews.filter((x) => x.moderation_status === "pending").length,
    [reviews]
  );

  function toOne<T>(x: T | T[] | null): T | null {
    if (!x) return null;
    return Array.isArray(x) ? (x[0] ?? null) : x;
  }

  function onModerate(id: string, action: "approve" | "reject") {
    setMsg("");
    startTransition(async () => {
      const note = (noteById[id] ?? "").trim();
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMsg(json.error ?? "操作失敗");
        return;
      }
      setReviews((prev) => prev.filter((r) => r.id !== id));
      setMsg(action === "approve" ? "已通過 1 則評分。" : "已拒絕 1 則評分。");
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        現有待審核評分：<span className="font-semibold text-foreground">{pendingCount}</span> 則
      </p>
      {msg ? <p className="text-sm text-muted-foreground">{msg}</p> : null}

      {reviews.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">目前沒有待審核評分。</CardContent>
        </Card>
      ) : null}

      {reviews.map((review) => {
        const tour = toOne(review.tour);
        const member = toOne(review.member_account);
        const photos = Array.isArray(review.agency_review_photo) ? review.agency_review_photo : [];
        const cover = photos[0]?.public_url ?? "";
        return (
          <Card key={review.id}>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base font-semibold">
                  {tour?.title ?? `Tour #${review.source_tour_id ?? "N/A"}`} · {tour?.agency ?? "未知旅行社"}
                </h3>
                <span className="text-xs text-muted-foreground">
                  {new Date(review.created_at).toLocaleString("zh-HK")}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>
                評價者：{review.reviewer_display_name || member?.member_name || "會員"}（{member?.email || "未知 email"}）
              </p>
              <p>
                平均分：{avgScore(review)} / 5（行程 {review.itinerary_rating} / 膳食 {review.meal_rating} / 住宿{" "}
                {review.hotel_rating} / 導遊 {review.guide_rating} / 性價比 {Number(review.value_rating ?? 3)}）
              </p>
              <p>會否再報：{review.will_rebook ? "會" : "不會"}</p>
              {review.comment ? <p className="whitespace-pre-wrap">評語：{review.comment}</p> : null}
              {review.extra_info ? <p className="whitespace-pre-wrap">額外資料：{review.extra_info}</p> : null}
              {review.participation_proof ? (
                <p className="whitespace-pre-wrap">參團證明：{review.participation_proof}</p>
              ) : null}
              {cover ? (
                <a href={cover} target="_blank" rel="noopener noreferrer" className="underline">
                  查看第一張圖片（共 {photos.length} 張）
                </a>
              ) : null}

              <div className="space-y-2 border-t pt-3">
                <label className="text-xs text-muted-foreground" htmlFor={`note-${review.id}`}>
                  拒絕原因（可選）
                </label>
                <textarea
                  id={`note-${review.id}`}
                  className="min-h-[72px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                  value={noteById[review.id] ?? ""}
                  onChange={(e) => setNoteById((prev) => ({ ...prev, [review.id]: e.target.value }))}
                />
                <div className="flex gap-2">
                  <Button disabled={isPending} onClick={() => onModerate(review.id, "approve")}>
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    disabled={isPending}
                    onClick={() => onModerate(review.id, "reject")}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

