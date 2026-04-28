import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getAgencyOverviews } from "@/lib/data/reviews";
import { agencyToSlug } from "@/lib/agencies";

export const metadata: Metadata = {
  title: "旅行社總覽",
  description: "查看各旅行社評論統計與各項平均分。",
};

function score(n: number): string {
  return n.toFixed(1);
}

export default async function AgencyOverviewPage() {
  const agencies = await getAgencyOverviews(200);

  return (
    <div className="container px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">旅行社總覽</h1>
          <p className="text-sm text-muted-foreground">集齊所有已審核評論，查看各旅行社整體與分項平均分數。</p>
          <p className="text-sm">
            <Link href="/reviews" className="text-primary hover:underline">
              ← 返回旅程分享
            </Link>
          </p>
        </header>

        {agencies.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-sm text-muted-foreground">暫時沒有可用的旅行社評論統計資料。</CardContent>
          </Card>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {agencies.map((item) => {
              const slug = agencyToSlug(item.agency);
              const href = slug
                ? `/reviews/agencies/${slug}`
                : `/reviews?agency=${encodeURIComponent(item.agency)}`;
              return (
                <li key={item.agency}>
                  <Link href={href} className="block">
                    <Card className="h-full transition-colors hover:bg-muted/40">
                      <CardHeader className="space-y-1">
                        <h2 className="text-lg font-semibold">
                          {item.agency}
                          <span className="ml-2 text-base font-bold text-amber-700">{score(item.overallAvg)} / 5</span>
                        </h2>
                        <p className="text-sm text-muted-foreground">評論數：{item.total}</p>
                      </CardHeader>
                      <CardContent className="space-y-1 text-sm">
                        <p>行程：{score(item.itineraryAvg)} / 5</p>
                        <p>膳食：{score(item.mealAvg)} / 5</p>
                        <p>住宿：{score(item.hotelAvg)} / 5</p>
                        <p>工作人員：{score(item.guideAvg)} / 5</p>
                        <p>性價比：{score(item.valueAvg)} / 5</p>
                      </CardContent>
                    </Card>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
