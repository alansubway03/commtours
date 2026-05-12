import { getTours } from "@/lib/data/tours";
import { getAgencyScoreMap } from "@/lib/data/reviews";
import { HomeMarketingSections } from "@/components/HomeMarketingSections";
import { HomeTourSections } from "@/components/HomeTourSections";

export default async function HomePage() {
  const tours = await getTours();
  const agencyScoreMap = await getAgencyScoreMap(tours.map((tour) => String(tour.agency)));

  return (
    <div>
      <HomeMarketingSections />

      {/* 類型分頁：熱門行程 + 各類型旅行團 */}
      <HomeTourSections tours={tours} agencyScoreMap={agencyScoreMap} />
    </div>
  );
}
