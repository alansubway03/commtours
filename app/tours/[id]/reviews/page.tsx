import Link from "next/link";
import { notFound } from "next/navigation";
import { getTourById } from "@/lib/data/tours";
import { getTourReviewSummary, getTourReviews } from "@/lib/data/reviews";
import { TourReviewForm } from "@/components/TourReviewForm";
import { TourReviewBrowseClient } from "@/components/TourReviewBrowseClient";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function renderScore(n: number): string {
  return n.toFixed(1);
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tour = await getTourById(id);
  if (!tour) return { title: "會員評價" };
  return {
    title: `${tour.title} — 會員評價`,
    description: `查看此旅行團的會員評分與評語（已審核公開）`,
  };
}

export default async function TourReviewsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tour = await getTourById(id);
  if (!tour) notFound();

  const [summary, reviews] = await Promise.all([getTourReviewSummary(id), getTourReviews(id, 200)]);

  return (
    <div className="container px-4 py-6 md:py-8">
      <nav
        aria-label="麵包屑導覽"
        className="mb-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground"
      >
        <Link href="/" className="hover:underline">
          首頁
        </Link>
        <span>/</span>
        <Link href="/tours" className="hover:underline">
          旅行團列表
        </Link>
        <span>/</span>
        <Link href={`/tours/${tour.id}`} className="max-w-[40vw] truncate hover:underline">
          {tour.title}
        </Link>
        <span>/</span>
        <span>會員評價</span>
      </nav>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">{tour.title}</h1>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/tours/${tour.id}`}>← 返回旅行團詳情</Link>
        </Button>
      </div>

      <div className="mx-auto max-w-3xl space-y-8">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">已公開評價</h2>
            <p className="text-sm text-muted-foreground">
              以下為管理員審核通過的評分。新提交的評價需審核後才會顯示。
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {summary.total > 0 ? (
              <div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm">
                <p className="font-medium">此團評分摘要</p>
                <ul className="mt-2 grid gap-1 sm:grid-cols-2">
                  <li>評分則數：{summary.total}</li>
                  <li>整體平均：{renderScore(summary.overallAvg)} / 5</li>
                  <li>行程：{renderScore(summary.itineraryAvg)} / 5</li>
                  <li>膳食：{renderScore(summary.mealAvg)} / 5</li>
                  <li>住宿：{renderScore(summary.hotelAvg)} / 5</li>
                  <li>導遊/領隊：{renderScore(summary.guideAvg)} / 5</li>
                </ul>
              </div>
            ) : null}

            <TourReviewBrowseClient reviews={reviews} />
          </CardContent>
        </Card>

        <TourReviewForm tourId={tour.id} />
      </div>
    </div>
  );
}
