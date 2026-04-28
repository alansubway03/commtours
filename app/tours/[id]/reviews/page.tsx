import Link from "next/link";
import { notFound } from "next/navigation";
import { getTourById } from "@/lib/data/tours";
import { getAgencyReviewSummary, getAgencyReviews } from "@/lib/data/reviews";
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
    title: `${tour.agency} — 會員評價`,
    description: `查看此旅行社的會員評分與評語（已審核公開）`,
  };
}

export default async function TourReviewsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tour = await getTourById(id);
  if (!tour) notFound();

  const [summary, reviews] = await Promise.all([
    getAgencyReviewSummary(tour.agency),
    getAgencyReviews(tour.agency, 300),
  ]);

  return (
    <div className="container px-4 py-6 md:py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">{tour.agency}</h1>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/reviews?agency=${encodeURIComponent(tour.agency)}`}>← 返回旅程分享</Link>
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
            {summary && summary.total > 0 ? (
              <div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm">
                <p className="font-medium">此旅行社評分摘要</p>
                <ul className="mt-2 grid gap-1 sm:grid-cols-2">
                  <li>評分則數：{summary.total}</li>
                  <li>整體平均：{renderScore(summary.overallAvg)} / 5</li>
                  <li>行程：{renderScore(summary.itineraryAvg)} / 5</li>
                  <li>膳食：{renderScore(summary.mealAvg)} / 5</li>
                  <li>住宿：{renderScore(summary.hotelAvg)} / 5</li>
                  <li>工作人員：{renderScore(summary.guideAvg)} / 5</li>
                  <li>性價比：{renderScore(summary.valueAvg)} / 5</li>
                </ul>
              </div>
            ) : null}

            <TourReviewBrowseClient reviews={reviews} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
