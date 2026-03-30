import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { TourReviewListItem, TourReviewSummary } from "@/lib/data/reviews";

function renderScore(n: number): string {
  return n.toFixed(1);
}

export function TourReviewList({
  summary,
  reviews,
}: {
  summary: TourReviewSummary;
  reviews: TourReviewListItem[];
}) {
  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">會員評分總覽</h3>
      </CardHeader>
      <CardContent className="space-y-4">
        {summary.total === 0 ? (
          <p className="text-sm text-muted-foreground">暫時未有會員評分。</p>
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

            <div className="space-y-3 border-t pt-3">
              {reviews.map((review) => (
                <div key={review.id} className="rounded-md border p-3 text-sm">
                  <p className="text-xs text-muted-foreground">
                    {new Date(review.createdAt).toLocaleDateString("zh-HK")}
                  </p>
                  <p>
                    行程 {review.itineraryRating} / 膳食 {review.mealRating} / 住宿 {review.hotelRating} /
                    導遊 {review.guideRating}
                  </p>
                  <p>會否再報：{review.willRebook ? "Yes" : "No"}</p>
                  {review.participationProof ? <p>參團證明：{review.participationProof}</p> : null}
                  {review.comment ? <p>評語：{review.comment}</p> : null}
                  {review.extraInfo ? <p>額外資料：{review.extraInfo}</p> : null}
                  {review.photos.length > 0 ? (
                    <p>
                      照片：{review.photos.length} 張（
                      <a
                        className="underline"
                        href={review.photos[0].publicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        查看第一張
                      </a>
                      ）
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
