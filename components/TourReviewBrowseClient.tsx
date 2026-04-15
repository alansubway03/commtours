"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import type { TourReviewListItem } from "@/lib/data/reviews";
import { commentPreview, reviewOverallAverage } from "@/lib/reviewHelpers";
import { Button } from "@/components/ui/button";

const PLACEHOLDER = "https://placehold.co/160x160/e2e8f0/64748b?text=無圖";

function scoreLabel(n: number): string {
  return n.toFixed(1);
}

export function TourReviewBrowseClient({ reviews }: { reviews: TourReviewListItem[] }) {
  const [active, setActive] = useState<TourReviewListItem | null>(null);

  const close = useCallback(() => setActive(null), []);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, close]);

  if (reviews.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        暫時沒有已公開的會員評價。歡迎你成為第一位（提交後須經審核）。
      </p>
    );
  }

  return (
    <>
      <ul className="space-y-4">
        {reviews.map((review) => {
          const cover = review.photos[0]?.publicUrl ?? PLACEHOLDER;
          const avg = reviewOverallAverage(review);
          const dateStr = new Date(review.createdAt).toLocaleDateString("zh-HK", {
            year: "numeric",
            month: "short",
            day: "numeric",
          });
          return (
            <li key={review.id}>
              <button
                type="button"
                onClick={() => setActive(review)}
                className="flex w-full gap-4 rounded-xl border bg-card p-3 text-left shadow-sm transition hover:border-primary/30 hover:bg-muted/40"
              >
                <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-lg bg-muted sm:h-32 sm:w-32">
                  {cover === PLACEHOLDER ? (
                    <Image src={PLACEHOLDER} alt="" fill className="object-cover" unoptimized />
                  ) : (
                    <Image src={cover} alt="評價附圖" fill className="object-cover" sizes="128px" unoptimized />
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="font-medium text-foreground">{review.reviewerDisplayName}</p>
                  <p className="text-xs text-muted-foreground">{dateStr}</p>
                  <p className="text-sm">
                    整體平均 <span className="font-semibold text-amber-700">{scoreLabel(avg)}</span>
                    <span className="text-muted-foreground"> / 5</span>
                  </p>
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {commentPreview(review.comment) || "（無文字評語）"}
                  </p>
                  <p className="text-xs text-muted-foreground">按此查看詳情、相片與分項評分</p>
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      {active ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-detail-title"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border bg-background p-5 shadow-lg"
          >
            <div className="mb-4 flex items-start justify-between gap-2">
              <div>
                <h2 id="review-detail-title" className="text-lg font-semibold">
                  {active.reviewerDisplayName}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {new Date(active.createdAt).toLocaleString("zh-HK", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={close}>
                關閉
              </Button>
            </div>

            <p className="mb-4 text-sm">
              整體平均 <span className="font-semibold text-amber-700">{scoreLabel(reviewOverallAverage(active))}</span>
              <span className="text-muted-foreground"> / 5</span>
            </p>

            <div className="mb-4 grid grid-cols-2 gap-2 text-sm">
              <p>行程：{active.itineraryRating} / 5</p>
              <p>膳食：{active.mealRating} / 5</p>
              <p>住宿：{active.hotelRating} / 5</p>
              <p>導遊/領隊：{active.guideRating} / 5</p>
              <p className="col-span-2">會否再報此旅行社：{active.willRebook ? "會" : "不會"}</p>
            </div>

            {active.photos.length > 0 ? (
              <div className="mb-4">
                <h3 className="mb-2 text-sm font-medium">相片（{active.photos.length} 張）</h3>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {active.photos.map((ph) => (
                    <a
                      key={ph.publicUrl}
                      href={ph.publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative aspect-square overflow-hidden rounded-md bg-muted"
                    >
                      <Image src={ph.publicUrl} alt="" fill className="object-cover" unoptimized />
                    </a>
                  ))}
                </div>
              </div>
            ) : null}

            {active.comment.trim() ? (
              <div className="mb-4">
                <h3 className="mb-1 text-sm font-medium">評語</h3>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{active.comment}</p>
              </div>
            ) : null}

            {active.extraInfo.trim() ? (
              <div className="mb-4">
                <h3 className="mb-1 text-sm font-medium">額外資料</h3>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{active.extraInfo}</p>
              </div>
            ) : null}

            {active.participationProof.trim() ? (
              <div>
                <h3 className="mb-1 text-sm font-medium">參團證明（會員提供）</h3>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{active.participationProof}</p>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
