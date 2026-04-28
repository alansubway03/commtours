import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getRecentApprovedReviews } from "@/lib/data/reviews";
import { ReviewFeedClient } from "@/components/ReviewFeedClient";

export const metadata: Metadata = {
  title: "旅程分享",
  description: "查看 100% 參團者提交並通過審核的旅行團評論與評分。",
};

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ agency?: string }>;
}) {
  const params = await searchParams;
  const reviews = await getRecentApprovedReviews(200);
  const initialAgencyFilter = params.agency?.trim() ? params.agency.trim() : "all";
  return <ReviewsPageContent reviews={reviews} initialAgencyFilter={initialAgencyFilter} />;
}

function ReviewsPageContent({
  reviews,
  initialAgencyFilter,
}: {
  reviews: Awaited<ReturnType<typeof getRecentApprovedReviews>>;
  initialAgencyFilter: string;
}) {
  const agencyCount = new Set(reviews.map((x) => x.agency).filter((x) => x.trim())).size;

  return (
    <div>
      <section className="relative flex min-h-[320px] flex-col items-center justify-center gap-4 px-4 py-12 text-center text-white md:min-h-[380px]">
        <Image
          src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1920"
          alt="旅程分享頁面背景"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 to-black/60" />
        <h1 className="relative max-w-3xl text-3xl font-bold leading-tight drop-shadow-md sm:text-4xl md:text-5xl">
          旅程分享
        </h1>
        <p className="relative max-w-2xl text-sm text-white/95 drop-shadow sm:text-base md:text-lg">
          所有評論均為真實參團者提交，需有關部門核實後才會顯示。以清晰評分與留言，快速比較旅行社體驗。
        </p>
        <div className="relative mt-2 flex flex-wrap justify-center gap-2 text-xs">
          <span className="rounded-full bg-white/85 px-3 py-1 text-slate-700 shadow-sm">已公開分享 {reviews.length} 則</span>
          <span className="rounded-full bg-white/85 px-3 py-1 text-slate-700 shadow-sm">涵蓋旅行社 {agencyCount} 間</span>
        </div>
      </section>

      <div className="container px-4 py-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <header className="flex flex-wrap items-center justify-between gap-2">
            <Button variant="outline" asChild>
              <Link href="/reviews/agencies">旅行社總覽</Link>
            </Button>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" asChild>
                <Link href="/reviews/my">我的分享</Link>
              </Button>
              <Button asChild>
                <Link href="/reviews/share">分享行程</Link>
              </Button>
            </div>
          </header>

          <ReviewFeedClient reviews={reviews} initialAgencyFilter={initialAgencyFilter} />
        </div>
      </div>
    </div>
  );
}
