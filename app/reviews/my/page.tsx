import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCurrentMember } from "@/lib/memberAuth";
import { getMemberReviews, reviewOverallAverage } from "@/lib/data/reviews";

export const metadata: Metadata = {
  title: "我的分享",
  description: "查看你提交過的旅程分享與批核狀態。",
};

function statusLabel(status: "pending" | "approved" | "rejected"): string {
  if (status === "approved") return "已通過";
  if (status === "rejected") return "已拒絕";
  return "審核中";
}

function statusClass(status: "pending" | "approved" | "rejected"): string {
  if (status === "approved") return "bg-emerald-100 text-emerald-700";
  if (status === "rejected") return "bg-rose-100 text-rose-700";
  return "bg-amber-100 text-amber-700";
}

function score(n: number): string {
  return n.toFixed(1);
}

export default async function MyReviewsPage() {
  const member = await getCurrentMember();
  if (!member) redirect("/member");

  const reviews = await getMemberReviews(member.id, 200);

  return (
    <div className="container px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">我的分享</h1>
            <p className="text-sm text-muted-foreground">查看你提交過的留言、分數與批核情況。</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/reviews">返回旅程分享</Link>
            </Button>
            <Button asChild>
              <Link href="/reviews/share">再分享行程</Link>
            </Button>
          </div>
        </header>

        {reviews.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-sm text-muted-foreground">你暫時未有提交任何分享。</CardContent>
          </Card>
        ) : (
          <ul className="space-y-4">
            {reviews.map((review) => (
              <li key={review.id}>
                <Card>
                  <CardHeader className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">{review.agency}</p>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(review.moderationStatus)}`}>
                        {statusLabel(review.moderationStatus)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(review.createdAt).toLocaleDateString("zh-HK", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      ・ 團號：{review.groupCode || "未提供"} ・ 目的地：{review.destinationCategory}
                    </p>
                    <p className="text-sm">
                      整體平均 <span className="font-semibold text-amber-700">{score(reviewOverallAverage(review))}⭐</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      行程 {review.itineraryRating} / 膳食 {review.mealRating} / 住宿 {review.hotelRating} / 工作人員{" "}
                      {review.guideRating} / 性價比 {review.valueRating}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p className="whitespace-pre-wrap text-muted-foreground">{review.comment.trim() || "（沒有文字內容）"}</p>
                    {review.moderationStatus === "rejected" && review.moderationNote ? (
                      <p className="rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-700">拒絕原因：{review.moderationNote}</p>
                    ) : null}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
