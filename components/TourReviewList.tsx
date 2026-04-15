import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { TourReviewSummary } from "@/lib/data/reviews";

function renderScore(n: number): string {
  return n.toFixed(1);
}

export function TourReviewList({ tourId, summary }: { tourId: string; summary: TourReviewSummary }) {
  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">會員評分總覽</h3>
      </CardHeader>
      <CardContent className="space-y-4">
        {summary.total === 0 ? (
          <p className="text-sm text-muted-foreground">
            暫時未有已公開的會員評分。
            <Link className="ml-1 underline" href={`/tours/${tourId}/reviews`}>
              前往評價專頁
            </Link>
            提交第一則評價（須審核）。
          </p>
        ) : (
          <>
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <p>評分數：{summary.total}</p>
              <p>整體平均：{renderScore(summary.overallAvg)} / 5</p>
              <p>行程：{renderScore(summary.itineraryAvg)} / 5</p>
              <p>膳食：{renderScore(summary.mealAvg)} / 5</p>
              <p>住宿：{renderScore(summary.hotelAvg)} / 5</p>
              <p>導遊/領隊：{renderScore(summary.guideAvg)} / 5</p>
              <p>會再報名比率：{summary.willRebookYesRate.toFixed(0)}%</p>
            </div>
            <Button variant="secondary" asChild className="w-full sm:w-auto">
              <Link href={`/tours/${tourId}/reviews`}>查看全部會員評價（附圖文詳情）</Link>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
