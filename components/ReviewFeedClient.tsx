"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ReviewFeedItem } from "@/lib/data/reviews";
import { reviewOverallAverage } from "@/lib/reviewHelpers";
import { TOUR_TYPE_LABELS } from "@/types/tour";

function scoreLabel(n: number): string {
  return n.toFixed(1);
}

function truncateComment(text: string, maxChars = 50): string {
  const chars = Array.from(text.trim());
  if (chars.length <= maxChars) return text.trim();
  return `${chars.slice(0, maxChars).join("")}...`;
}

function extractGroupCode(proof: string): string {
  const text = proof.trim();
  if (!text) return "";
  const m = text.match(/團號\s*[:：]?\s*(.+)$/);
  return (m?.[1] ?? text).trim();
}

function displayInitial(name: string): string {
  const chars = Array.from(name.trim());
  return chars[0] ?? "旅";
}

export function ReviewFeedClient({
  reviews,
  initialAgencyFilter = "all",
}: {
  reviews: ReviewFeedItem[];
  initialAgencyFilter?: string;
}) {
  const [countryFilter, setCountryFilter] = useState("all");
  const [agencyFilter, setAgencyFilter] = useState(initialAgencyFilter);
  const [tourTypeFilter, setTourTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"latest" | "highest">("latest");
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    setAgencyFilter(initialAgencyFilter);
  }, [initialAgencyFilter]);

  const countryOptions = useMemo(
    () => ["歐洲", "北美", "亞洲", "澳洲/紐西蘭", "南美", "中東", "非洲", "極地及郵輪"],
    []
  );

  const agencyOptions = useMemo(
    () => Array.from(new Set(reviews.map((r) => r.agency).filter((x) => x.trim()))),
    [reviews]
  );

  const tourTypeOptions = useMemo(
    () => Array.from(new Set(reviews.map((r) => r.tourType).filter((x) => x.trim()))),
    [reviews]
  );

  const filtered = useMemo(() => {
    const key = keyword.trim().toLowerCase();
    const base = reviews.filter((r) => {
      if (countryFilter !== "all" && r.countryCategory !== countryFilter) return false;
      if (agencyFilter !== "all" && r.agency !== agencyFilter) return false;
      if (tourTypeFilter !== "all" && r.tourType !== tourTypeFilter) return false;
      if (!key) return true;
      const haystack = `${r.tourTitle} ${r.destination} ${r.region} ${r.agency} ${r.comment}`.toLowerCase();
      return haystack.includes(key);
    });
    const ranked = [...base];
    if (sortBy === "highest") {
      ranked.sort((a, b) => reviewOverallAverage(b) - reviewOverallAverage(a));
    } else {
      ranked.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return ranked;
  }, [reviews, countryFilter, agencyFilter, tourTypeFilter, keyword, sortBy]);

  if (reviews.length === 0) {
    return (
      <Card className="rounded-2xl border-emerald-100 bg-emerald-50/50">
        <CardContent className="py-8 text-sm text-muted-foreground">暫時沒有已公開的旅程分享。</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="rounded-2xl border-emerald-100 bg-gradient-to-br from-emerald-50/70 via-sky-50/40 to-white">
        <CardContent className="grid gap-3 py-4 md:grid-cols-5">
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">旅行社</span>
            <select
              className="h-9 w-full rounded-md border bg-background px-3 text-sm"
              value={agencyFilter}
              onChange={(e) => setAgencyFilter(e.target.value)}
            >
              <option value="all">全部旅行社</option>
              {agencyOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">目的地</span>
            <select
              className="h-9 w-full rounded-md border bg-background px-3 text-sm"
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
            >
              <option value="all">全部國家分類</option>
              {countryOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">類型</span>
            <select
              className="h-9 w-full rounded-md border bg-background px-3 text-sm"
              value={tourTypeFilter}
              onChange={(e) => setTourTypeFilter(e.target.value)}
            >
              <option value="all">全部類型</option>
              {tourTypeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {TOUR_TYPE_LABELS[opt as keyof typeof TOUR_TYPE_LABELS] ?? opt}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">排序</span>
            <select
              className="h-9 w-full rounded-md border bg-background px-3 text-sm"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "latest" | "highest")}
            >
              <option value="latest">最新</option>
              <option value="highest">最高評分</option>
            </select>
          </label>

          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">關鍵字</span>
            <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="搜尋評語或地點" />
          </label>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">共 {filtered.length} 則分享</p>

      <ul className="space-y-4">
        {filtered.map((review) => (
          <li key={review.id}>
            <Card className="overflow-hidden rounded-2xl border-sky-100/80 shadow-sm transition-shadow hover:shadow-md">
              <div className="h-1 w-full bg-gradient-to-r from-emerald-300 via-sky-300 to-cyan-300" />
              <CardHeader className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">
                      {displayInitial(review.reviewerDisplayName)}
                    </span>
                    <p className="font-medium">{review.reviewerDisplayName}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(review.createdAt).toLocaleDateString("zh-HK", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <p className="text-sm">
                  整體平均 <span className="font-semibold text-amber-700">{scoreLabel(reviewOverallAverage(review))}⭐</span>
                </p>
                <p className="text-xs text-muted-foreground">會否再報此旅行社：{review.willRebook ? "會" : "不會"}</p>
                <p className="text-xs text-muted-foreground">
                  行程 {review.itineraryRating} / 膳食 {review.mealRating} / 住宿 {review.hotelRating} / 工作人員{" "}
                  {review.guideRating} / 性價比 {review.valueRating}
                </p>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="font-medium text-foreground">{review.agency}</p>
                <p className="text-xs text-muted-foreground">目的地：{review.countryCategory}</p>
                {extractGroupCode(review.participationProof) ? (
                  <p className="text-xs text-muted-foreground">團號：{extractGroupCode(review.participationProof)}</p>
                ) : null}
                <p className="text-xs text-muted-foreground">
                  總收費：HKD{" "}
                  {(review.baseFeeHkd + review.optionalActivityFeeHkd + review.staffServiceFeeHkd).toFixed(2)}（團費{" "}
                  {review.baseFeeHkd.toFixed(2)} / 自費 {review.optionalActivityFeeHkd.toFixed(2)} / 服務費{" "}
                  {review.staffServiceFeeHkd.toFixed(2)}）
                </p>
                <p className="whitespace-pre-wrap text-muted-foreground">
                  {review.comment.trim() ? truncateComment(review.comment, 50) : "（此分享沒有文字內容）"}
                </p>
                {review.tourId > 0 ? (
                  <Link className="text-sm text-primary hover:underline" href={`/tours/${review.tourId}/reviews`}>
                    查看完整評論
                  </Link>
                ) : (
                  <Link className="text-sm text-primary hover:underline" href={`/reviews?agency=${encodeURIComponent(review.agency)}`}>
                    查看完整評論
                  </Link>
                )}
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
