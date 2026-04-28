import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { agencyFromSlug, AGENCY_FILTER_OPTIONS, AGENCY_INTRO_BY_SLUG } from "@/lib/agencies";
import { getAgencyReviewSummary, getAgencyReviews } from "@/lib/data/reviews";

type Props = {
  params: Promise<{ slug: string }>;
};

function score(n: number): string {
  return n.toFixed(1);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("zh-HK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export async function generateStaticParams() {
  return AGENCY_FILTER_OPTIONS.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const agency = agencyFromSlug(slug);
  if (!agency) {
    return { title: "找不到旅行社" };
  }
  return {
    title: `${agency} 評分與評論`,
    description: `查看 ${agency} 的整體評分、各細項分數及使用者留言。`,
  };
}

export default async function AgencyDetailPage({ params }: Props) {
  const { slug } = await params;
  const agency = agencyFromSlug(slug);
  if (!agency) notFound();

  const [summary, reviews] = await Promise.all([getAgencyReviewSummary(agency), getAgencyReviews(agency, 200)]);
  const intro = AGENCY_INTRO_BY_SLUG[slug as keyof typeof AGENCY_INTRO_BY_SLUG];

  return (
    <div className="container px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            {agency}
            <span className="ml-2 text-2xl font-bold text-amber-700">{score(summary?.overallAvg ?? 0)} / 5</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            {intro ?? `${agency} 的評分與留言整理頁，資料來自已審核的真實參團者評論。`}
          </p>
          <p className="text-sm">
            <Link href="/reviews/agencies" className="text-primary hover:underline">
              ← 返回旅行社總覽
            </Link>
          </p>
        </header>

        <Card>
          <CardHeader className="space-y-1">
            <h2 className="text-lg font-semibold">評分總覽</h2>
            <p className="text-sm text-muted-foreground">只顯示已審核評論，無額外篩選條件。</p>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm md:grid-cols-2">
            <p>評論數：{summary?.total ?? 0}</p>
            <p>整體平均：{score(summary?.overallAvg ?? 0)} / 5</p>
            <p>行程：{score(summary?.itineraryAvg ?? 0)} / 5</p>
            <p>膳食：{score(summary?.mealAvg ?? 0)} / 5</p>
            <p>住宿：{score(summary?.hotelAvg ?? 0)} / 5</p>
            <p>工作人員：{score(summary?.guideAvg ?? 0)} / 5</p>
            <p>性價比：{score(summary?.valueAvg ?? 0)} / 5</p>
          </CardContent>
        </Card>

        {reviews.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-sm text-muted-foreground">暫時沒有可顯示的留言。</CardContent>
          </Card>
        ) : (
          <ul className="space-y-4">
            {reviews.map((review) => (
              <li key={review.id}>
                <Card>
                  <CardHeader className="space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">{review.reviewerDisplayName}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(review.createdAt)}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      行程 {review.itineraryRating} / 膳食 {review.mealRating} / 住宿 {review.hotelRating} / 工作人員{" "}
                      {review.guideRating} / 性價比 {review.valueRating}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                      {review.comment.trim() || "（此分享沒有文字內容）"}
                    </p>
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
